import type {
  MatchStatus,
} from "../models/smile";


interface Props {
  status: MatchStatus;
}


export default function StatusBadge({
  status,
}: Props) {

  const labels:
    Record<
      MatchStatus,
      string
    > = {

      NEW:
        "NEW",

      MATCHED:
        "MATCHED",

      NOT_FOUND:
        "NOT FOUND",

      AMBIGUOUS:
        "REVIEW",

      INVALID:
        "INVALID",

      DUPLICATE:
        "DUPLICATE",
    };


  return (

    <span
      className={
        `status-badge status-${status.toLowerCase()}`
      }
    >
      {labels[status]}
    </span>
  );
}