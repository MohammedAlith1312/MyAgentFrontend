import { forwardRef } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "../UI/Button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  className?: string;
  disabled?: boolean; // Add this line
}

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ onFileSelect, accept = ".txt,.pdf,.doc,.docx", className, disabled = false }, ref) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    };

    const handleClick = () => {
      if (!disabled) {
        document.getElementById("file-upload")?.click();
      }
    };

    return (
      <>
        <input
          type="file"
          ref={ref}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
          id="file-upload"
          disabled={disabled} // Add this
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={className}
          onClick={handleClick}
          disabled={disabled}
        >
          <Paperclip className="w-4 h-4" />
        </Button>
      </>
    );
  }
);

FileUpload.displayName = "FileUpload";

export { FileUpload };