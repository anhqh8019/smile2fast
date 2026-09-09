import {
  useRef,
  type ChangeEvent,
} from "react";

interface Props {
  disabled?: boolean;

  onFilesSelected: (
    files: File[]
  ) => void;
}


export default function MultiImageUpload({
  disabled = false,
  onFilesSelected,
}: Props) {

  const inputRef =
    useRef<HTMLInputElement>(null);


  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {

    const files =
      Array.from(
        event.target.files ?? []
      );

    if (files.length === 0) {
      return;
    }

    const images =
      files.filter(
        file =>
          file.type.startsWith(
            "image/"
          )
      );

    if (
      images.length !== files.length
    ) {
      alert(
        "Một số file không phải ảnh và đã bị bỏ qua."
      );
    }

    onFilesSelected(
      images
    );

    // Cho phép chọn lại đúng file cũ.
    event.target.value = "";
  };


  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleChange}
      />

      <button
        className="primary-button"
        disabled={disabled}
        onClick={() =>
          inputRef.current?.click()
        }
      >
        Chọn nhiều ảnh Smile
      </button>
    </>
  );
}