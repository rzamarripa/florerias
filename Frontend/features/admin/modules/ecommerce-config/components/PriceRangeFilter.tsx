import { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface PriceRangeFilterProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
}

const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  min,
  max,
  value,
  onChange
}) => {
  const [localMin, setLocalMin] = useState(value[0]);
  const [localMax, setLocalMax] = useState(value[1]);

  useEffect(() => {
    setLocalMin(value[0]);
    setLocalMax(value[1]);
  }, [value]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = parseFloat(e.target.value);
    setLocalMin(newMin);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = parseFloat(e.target.value);
    setLocalMax(newMax);
  };

  const handleRangeUpdate = () => {
    const validMin = Math.max(min, Math.min(localMin, localMax));
    const validMax = Math.min(max, Math.max(localMin, localMax));
    onChange([validMin, validMax]);
  };

  const getProgressStyle = () => {
    const minPercent = ((localMin - min) / (max - min)) * 100;
    const maxPercent = ((localMax - min) / (max - min)) * 100;
    return {
      left: `${minPercent}%`,
      width: `${maxPercent - minPercent}%`
    };
  };

  return (
    <div className="pt-4">
      <div className="flex items-center mb-3">
        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
        <h6 className="text-sm font-medium mb-0">Rango de Precio</h6>
      </div>

      <div className="bg-muted/50 p-2 rounded mb-3">
        <div className="flex justify-between items-center">
          <Badge variant="secondary">{formatPrice(localMin)}</Badge>
          <span className="text-muted-foreground">-</span>
          <Badge variant="secondary">{formatPrice(localMax)}</Badge>
        </div>
      </div>

      <div className="relative h-10 py-2.5 mb-3">
        {/* Track */}
        <div className="absolute w-full h-1.5 bg-muted rounded top-1/2 -translate-y-1/2" />

        {/* Progress */}
        <div
          className="absolute h-1.5 bg-gradient-to-r from-primary to-primary/80 rounded top-1/2 -translate-y-1/2"
          style={getProgressStyle()}
        />

        {/* Min Slider */}
        <input
          type="range"
          className="absolute w-full top-0 h-10 bg-transparent pointer-events-none z-10 appearance-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-primary
            [&::-webkit-slider-thumb]:bg-background
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:shadow-md
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-primary
            [&::-moz-range-thumb]:bg-background
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:shadow-md"
          min={min}
          max={max}
          step={(max - min) / 100}
          value={localMin}
          onChange={handleMinChange}
          onMouseUp={handleRangeUpdate}
          onTouchEnd={handleRangeUpdate}
        />

        {/* Max Slider */}
        <input
          type="range"
          className="absolute w-full top-0 h-10 bg-transparent pointer-events-none appearance-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-primary
            [&::-webkit-slider-thumb]:bg-background
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:shadow-md
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-primary
            [&::-moz-range-thumb]:bg-background
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:shadow-md"
          min={min}
          max={max}
          step={(max - min) / 100}
          value={localMax}
          onChange={handleMaxChange}
          onMouseUp={handleRangeUpdate}
          onTouchEnd={handleRangeUpdate}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          className="h-9 text-sm"
          value={localMin}
          min={min}
          max={max}
          onChange={(e) => setLocalMin(parseFloat(e.target.value) || min)}
          onBlur={handleRangeUpdate}
          placeholder="Min"
        />
        <Input
          type="number"
          className="h-9 text-sm"
          value={localMax}
          min={min}
          max={max}
          onChange={(e) => setLocalMax(parseFloat(e.target.value) || max)}
          onBlur={handleRangeUpdate}
          placeholder="Max"
        />
      </div>
    </div>
  );
};

export default PriceRangeFilter;
