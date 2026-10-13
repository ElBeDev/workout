import localFont from "next/font/local";

const barlow = localFont({ src: "../fonts/BarlowCondensed-ExtraBold.ttf", display: "swap" });

/**
 * «ElBeFit» como en la firma de ElBe Games: Barlow Condensed ExtraBold con la
 * «l» alzada 17 %, porque en esta letra (y en Inter) «ElBe» se lee «EIBe»
 * (docs/rebrand-gainline.md §2).
 */
export function ElBeFit({ className = "" }: { className?: string }) {
  return (
    <span className={`${barlow.className} ${className}`}>
      <span aria-hidden>
        E<span className="inline-block origin-[50%_80%] scale-y-[1.17]">l</span>BeFit
      </span>
      <span className="sr-only">ElBeFit</span>
    </span>
  );
}
