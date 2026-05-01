import "../../globalStyles.css";

type Props = {
  message?: string;
};

export default function FieldError({ message }: Props) {
  if (!message) return null;
  return <span className="erro">{message}</span>;
}
