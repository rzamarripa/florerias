import { useState, useEffect } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { TbCurrencyDollar } from "react-icons/tb";

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
    <div className="price-range-filter">
      <div className="d-flex align-items-center mb-3">
        <TbCurrencyDollar size={18} className="me-2 text-muted" />
        <h6 className="mb-0">Rango de Precio</h6>
      </div>

      <div className="price-display mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <span className="badge bg-light text-dark">{formatPrice(localMin)}</span>
          <span className="text-muted">-</span>
          <span className="badge bg-light text-dark">{formatPrice(localMax)}</span>
        </div>
      </div>

      <div className="slider-container position-relative mb-3">
        <div className="slider-track"></div>
        <div className="slider-progress" style={getProgressStyle()}></div>
        
        <input
          type="range"
          className="form-range slider-input"
          min={min}
          max={max}
          step={(max - min) / 100}
          value={localMin}
          onChange={handleMinChange}
          onMouseUp={handleRangeUpdate}
          onTouchEnd={handleRangeUpdate}
        />
        
        <input
          type="range"
          className="form-range slider-input"
          min={min}
          max={max}
          step={(max - min) / 100}
          value={localMax}
          onChange={handleMaxChange}
          onMouseUp={handleRangeUpdate}
          onTouchEnd={handleRangeUpdate}
        />
      </div>

      <Row className="g-2">
        <Col xs={6}>
          <Form.Control
            type="number"
            size="sm"
            value={localMin}
            min={min}
            max={max}
            onChange={(e) => setLocalMin(parseFloat(e.target.value) || min)}
            onBlur={handleRangeUpdate}
            placeholder="Mín"
          />
        </Col>
        <Col xs={6}>
          <Form.Control
            type="number"
            size="sm"
            value={localMax}
            min={min}
            max={max}
            onChange={(e) => setLocalMax(parseFloat(e.target.value) || max)}
            onBlur={handleRangeUpdate}
            placeholder="Máx"
          />
        </Col>
      </Row>

      <style jsx>{`
        .price-range-filter {
          padding-top: 1rem;
        }
        .slider-container {
          height: 40px;
          padding: 10px 0;
        }
        .slider-track {
          position: absolute;
          width: 100%;
          height: 5px;
          background: #e9ecef;
          border-radius: 3px;
          top: 50%;
          transform: translateY(-50%);
        }
        .slider-progress {
          position: absolute;
          height: 5px;
          background: linear-gradient(90deg, #007bff, #0056b3);
          border-radius: 3px;
          top: 50%;
          transform: translateY(-50%);
        }
        .slider-input {
          position: absolute;
          width: 100%;
          top: 0;
          height: 40px;
          background: transparent;
          pointer-events: none;
          -webkit-appearance: none;
          z-index: 1;
        }
        .slider-input::-webkit-slider-thumb {
          pointer-events: auto;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #007bff;
          background: white;
          cursor: pointer;
          -webkit-appearance: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider-input::-moz-range-thumb {
          pointer-events: auto;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #007bff;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider-input:first-of-type {
          z-index: 2;
        }
        .price-display {
          background: #f8f9fa;
          padding: 0.5rem;
          border-radius: 0.25rem;
        }
      `}</style>
    </div>
  );
};

export default PriceRangeFilter;