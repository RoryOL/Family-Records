import { useEffect, useState } from "react";
import { initialsFrom } from "./memberDisplay";

const sizes = {
  sm: "size-9 text-xs",
  md: "size-14 text-lg",
  lg: "size-24 text-3xl",
} as const;

export function MemberAvatar({
  firstName,
  lastName,
  photoUrl,
  size = "md",
}: {
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  size?: keyof typeof sizes;
}) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [photoUrl]);

  const frame = `${sizes[size]} shrink-0 rounded-full`;
  if (photoUrl && !broken) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={`${frame} object-cover ring-1 ring-stone-200/60`}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <span aria-hidden className={`${frame} inline-flex items-center justify-center bg-amber-100 font-display font-bold text-stone-850`}>
      {initialsFrom(firstName, lastName)}
    </span>
  );
}
