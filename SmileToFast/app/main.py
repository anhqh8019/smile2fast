from fastapi import (
    FastAPI,
    File,
    UploadFile,
    HTTPException,
    Query,
)

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from fastapi.responses import (
    JSONResponse,
)


from app.services.smile_grid_parser import (
    SmileGridParseError,
)

from app.services.smile_ocr_service import (
    SmileOcrService,
)


app = FastAPI(
    title="Smile To FAST OCR",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


ocr_service = SmileOcrService()


@app.get("/health")
def health():

    return {
        "status": "UP"
    }


@app.post("/ocr/smile")
async def scan_smile(
    file: UploadFile = File(...),

    force_ocr: bool = Query(
        False,
        alias="forceOcr",
    ),
):

    if (
        not file.content_type
        or not file.content_type.startswith(
            "image/"
        )
    ):

        raise HTTPException(
            status_code=400,
            detail="File phải là ảnh.",
        )

    try:

        image_bytes = (
            await file.read()
        )

        result = (
            ocr_service.scan(
                image_bytes=image_bytes,
                force_ocr=force_ocr,
            )
        )

        return {
            "success": True,
            **result,
        }

    except SmileGridParseError as exc:

        return JSONResponse(
            status_code=422,
            content={
                "success": False,

                "error": {
                    "code":
                        "SMILE_GRID_PARSE_ERROR",

                    "message":
                        str(exc),
                },
            },
        )

    except ValueError as exc:

        return JSONResponse(
            status_code=422,
            content={
                "success": False,

                "error": {
                    "code":
                        "IMAGE_QUALITY_ERROR",

                    "message":
                        str(exc),
                },
            },
        )

    except Exception as exc:

        print(
            "OCR error:",
            repr(exc)
        )

        return JSONResponse(
            status_code=500,
            content={
                "success": False,

                "error": {
                    "code":
                        "OCR_INTERNAL_ERROR",

                    "message":
                        str(exc),
                },
            },
        )


@app.delete("/ocr/cache")
def clear_ocr_cache():

    count = (
        ocr_service.cache.clear()
    )

    return {
        "success": True,
        "deleted": count,
    }