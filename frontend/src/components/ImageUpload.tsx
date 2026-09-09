import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";

interface Props {
  onImageSelected: (
    file: File,
    previewUrl: string
  ) => void;
}

export default function ImageUpload({
  onImageSelected,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [fileName, setFileName] =
    useState<string>();

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh");
      return;
    }

    const url =
      URL.createObjectURL(file);

    setFileName(file.name);

    onImageSelected(
      file,
      url
    );
  };

  return (
    <div className="upload-box">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleChange}
      />

      <button
        className="primary-button"
        onClick={() =>
          inputRef.current?.click()
        }
      >
        Chọn ảnh Smile
      </button>

      {fileName && (
        <span className="file-name">
          {fileName}
        </span>
      )}
    </div>
  );
}