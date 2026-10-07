import { Button } from "@/components/ui/button";
import type { Money } from "@/contracts/marketplace";
import { fromWei, toWei } from "@/lib/money";
import type { CSSProperties } from "react";
import { useId, useState } from "react";

// Integer positions keep slider math separate from monetary decimal values.
const STEPS = 1000n;

type Props = {
  minPrice?: Money;
  maxPrice?: Money;
  catalogMax: Money;
  apply: (range: { minPrice: Money; maxPrice: Money }) => void;
};

export function PriceFilter({ minPrice, maxPrice, catalogMax, apply }: Props) {
  const id = useId();
  const ceiling = [
    toWei(catalogMax),
    toWei(minPrice ?? "0"),
    toWei(maxPrice ?? "0"),
    1n,
  ].reduce((highest, value) => (value > highest ? value : highest));
  const [minimum, setMinimum] = useState(minPrice ?? "0");
  const [maximum, setMaximum] = useState(maxPrice ?? fromWei(ceiling));
  const minWei = toWei(minimum);
  const maxWei = toWei(maximum);
  const position = (value: bigint) => Number((value * STEPS) / ceiling);
  const decimal = (value: string) => fromWei((BigInt(value) * ceiling) / STEPS);
  const percentage = (value: bigint) =>
    Number((value * 10000n) / ceiling) / 100;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        apply({ minPrice: minimum, maxPrice: maximum });
      }}
    >
      <h4 id={`${id}-title`} className="font-medium text-lg">
        Faixa de preço
      </h4>
      <div
        role="group"
        aria-labelledby={`${id}-title`}
        className="price-slider"
        style={
          {
            "--price-start": `${percentage(minWei)}%`,
            "--price-end": `${percentage(maxWei)}%`,
          } as CSSProperties
        }
      >
        <div className="price-slider-track" aria-hidden="true" />
        <input
          type="range"
          min={0}
          max={Number(STEPS)}
          step={1}
          value={position(minWei)}
          aria-label="Preço mínimo"
          aria-valuetext={`${minimum} ETH`}
          aria-describedby={`${id}-value`}
          style={{ zIndex: minWei === ceiling ? 3 : 1 }}
          onChange={(event) => {
            const next = toWei(decimal(event.target.value));
            setMinimum(fromWei(next > maxWei ? maxWei : next));
          }}
        />
        <input
          type="range"
          min={0}
          max={Number(STEPS)}
          step={1}
          value={position(maxWei)}
          aria-label="Preço máximo"
          aria-valuetext={`${maximum} ETH`}
          aria-describedby={`${id}-value`}
          style={{ zIndex: maxWei === 0n ? 0 : 2 }}
          onChange={(event) => {
            const next = toWei(decimal(event.target.value));
            setMaximum(fromWei(next < minWei ? minWei : next));
          }}
        />
      </div>
      <p id={`${id}-value`} className="text-base">
        Preço: {minimum.replace(".", ",")} – {maximum.replace(".", ",")} ETH
      </p>
      <Button type="submit" className="mt-5 min-h-9 px-3 py-1 text-xs">
        Aplicar
      </Button>
    </form>
  );
}
