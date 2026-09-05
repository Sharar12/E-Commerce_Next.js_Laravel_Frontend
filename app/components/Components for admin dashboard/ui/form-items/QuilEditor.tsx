import { FC, useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

type Props = {
  value: string;
  callBack: (value: string) => void;
  placeholder?: string;
};

const QuillEditor: FC<Props> = ({ value, callBack,placeholder="Write here..." }) => {
  const modules = useMemo(() => {
    return {
      clipboard: {
        matchVisual: false,
      },
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        [
          { list: "ordered" },
          { list: "bullet" },
          { indent: "-1" },
          { indent: "+1" },
        ],
        ["link", "image"],
        [{ align: [] }],
        [{ color: [] }, { background: [] }],
        ["clean"],
      ],
    };
  }, []);

  return (
    <div className="">
      <ReactQuill
        theme="snow"
        placeholder={placeholder}
        value={value}
        onChange={(content) => callBack(content)}
        modules={modules}
        className="quill-editor"
      />
    </div>
  );
};

export default QuillEditor;