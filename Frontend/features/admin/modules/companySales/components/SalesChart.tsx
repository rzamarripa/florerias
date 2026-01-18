import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatCurrency } from '@/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
    }[];
  };
  title?: string;
}

export default function SalesChart({ data, title = "Ventas" }: SalesChartProps) {
  // Estado para controlar qué líneas están visibles
  const [visibleDatasets, setVisibleDatasets] = useState<{ [key: string]: boolean }>({
    'Págos': true,
    'Gastos': true,
    'Regalías': true,
    'Publicidad Marca': true,
    'Publicidad Franquicia': true
  });

  // Alternar visibilidad de una línea
  const toggleDataset = (label: string) => {
    setVisibleDatasets(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 10,
        titleFont: {
          size: 12,
          family: "'Open Sans', sans-serif"
        },
        bodyFont: {
          size: 11,
          family: "'Open Sans', sans-serif"
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 10,
            family: "'Open Sans', sans-serif"
          },
          color: '#676a6c',
          padding: 5,
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        position: 'right' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        border: {
          display: false
        },
        ticks: {
          font: {
            size: 10,
            family: "'Open Sans', sans-serif"
          },
          color: '#676a6c',
          padding: 5,
          callback: function(value) {
            if (typeof value === 'number') {
              if (value >= 1000000) {
                return '$' + (value / 1000000).toFixed(1) + 'M';
              } else if (value >= 1000) {
                return '$' + Math.round(value / 1000) + 'K';
              }
              return '$' + value;
            }
            return value;
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
      point: {
        radius: 4,
        hitRadius: 10,
        hoverRadius: 6,
        hoverBorderWidth: 2,
        backgroundColor: 'white',
      }
    }
  };

  // Filtrar datasets visibles
  const chartData = useMemo(() => {
    const colors = [
      { border: '#1ab394', bg: 'rgba(26, 179, 148, 0.1)' },
      { border: '#f8ac59', bg: 'rgba(248, 172, 89, 0.1)' },
      { border: '#ed5565', bg: 'rgba(237, 85, 101, 0.1)' },
      { border: '#1c84c6', bg: 'rgba(28, 132, 198, 0.1)' },
      { border: '#23c6c8', bg: 'rgba(35, 198, 200, 0.1)' },
    ];

    return {
      ...data,
      datasets: data.datasets
        .map((dataset, index) => {
          const color = colors[index % colors.length];
          
          return {
            ...dataset,
            borderColor: dataset.borderColor || color.border,
            backgroundColor: dataset.backgroundColor || color.bg,
            fill: true,
            pointBackgroundColor: 'white',
            pointBorderColor: dataset.borderColor || color.border,
            pointHoverBackgroundColor: dataset.borderColor || color.border,
            pointHoverBorderColor: 'white',
            hidden: !visibleDatasets[dataset.label]
          };
        })
    };
  }, [data, visibleDatasets]);

  return (
    <div 
      className="card shadow-sm" 
      style={{ borderRadius: "10px" }}
    >
      <div className="card-body p-2">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0 fw-semibold">{title}</h6>
          <div className="d-flex gap-2 align-items-center">
            <small className="text-muted">Del {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} al {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
          </div>
        </div>
        
        <div style={{ height: '200px', position: 'relative' }}>
          <Line options={options} data={chartData} />
        </div>
        
        <div className="d-flex justify-content-center gap-2 mt-2">
          <button
            onClick={() => toggleDataset('Págos')}
            className="legend-button"
            style={{
              border: 'none',
              background: visibleDatasets['Págos'] ? 'rgba(26, 179, 148, 0.1)' : 'transparent',
              padding: '2px 8px',
              cursor: 'pointer',
              fontSize: '12px',
              opacity: visibleDatasets['Págos'] ? 1 : 0.4,
              transition: 'all 0.2s',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(26, 179, 148, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = visibleDatasets['Págos'] ? 'rgba(26, 179, 148, 0.1)' : 'transparent'}
          >
            <span style={{width: '10px', height: '10px', backgroundColor: '#1ab394', display: 'inline-block', borderRadius: '50%', marginRight: '5px'}}></span>
            Págos
          </button>
          <button
            onClick={() => toggleDataset('Gastos')}
            className="legend-button"
            style={{
              border: 'none',
              background: visibleDatasets['Gastos'] ? 'rgba(248, 172, 89, 0.1)' : 'transparent',
              padding: '2px 8px',
              cursor: 'pointer',
              fontSize: '12px',
              opacity: visibleDatasets['Gastos'] ? 1 : 0.4,
              transition: 'all 0.2s',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248, 172, 89, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = visibleDatasets['Gastos'] ? 'rgba(248, 172, 89, 0.1)' : 'transparent'}
          >
            <span style={{width: '10px', height: '10px', backgroundColor: '#f8ac59', display: 'inline-block', borderRadius: '50%', marginRight: '5px'}}></span>
            Gastos
          </button>
          <button
            onClick={() => toggleDataset('Regalías')}
            className="legend-button"
            style={{
              border: 'none',
              background: visibleDatasets['Regalías'] ? 'rgba(237, 85, 101, 0.1)' : 'transparent',
              padding: '2px 8px',
              cursor: 'pointer',
              fontSize: '12px',
              opacity: visibleDatasets['Regalías'] ? 1 : 0.4,
              transition: 'all 0.2s',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(237, 85, 101, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = visibleDatasets['Regalías'] ? 'rgba(237, 85, 101, 0.1)' : 'transparent'}
          >
            <span style={{width: '10px', height: '10px', backgroundColor: '#ed5565', display: 'inline-block', borderRadius: '50%', marginRight: '5px'}}></span>
            Regalías
          </button>
          <button
            onClick={() => toggleDataset('Publicidad Marca')}
            className="legend-button"
            style={{
              border: 'none',
              background: visibleDatasets['Publicidad Marca'] ? 'rgba(28, 132, 198, 0.1)' : 'transparent',
              padding: '2px 8px',
              cursor: 'pointer',
              fontSize: '12px',
              opacity: visibleDatasets['Publicidad Marca'] ? 1 : 0.4,
              transition: 'all 0.2s',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(28, 132, 198, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = visibleDatasets['Publicidad Marca'] ? 'rgba(28, 132, 198, 0.1)' : 'transparent'}
          >
            <span style={{width: '10px', height: '10px', backgroundColor: '#1c84c6', display: 'inline-block', borderRadius: '50%', marginRight: '5px'}}></span>
            Publicidad Marca
          </button>
          <button
            onClick={() => toggleDataset('Publicidad Franquicia')}
            className="legend-button"
            style={{
              border: 'none',
              background: visibleDatasets['Publicidad Franquicia'] ? 'rgba(35, 198, 200, 0.1)' : 'transparent',
              padding: '2px 8px',
              cursor: 'pointer',
              fontSize: '12px',
              opacity: visibleDatasets['Publicidad Franquicia'] ? 1 : 0.4,
              transition: 'all 0.2s',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(35, 198, 200, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = visibleDatasets['Publicidad Franquicia'] ? 'rgba(35, 198, 200, 0.1)' : 'transparent'}
          >
            <span style={{width: '10px', height: '10px', backgroundColor: '#23c6c8', display: 'inline-block', borderRadius: '50%', marginRight: '5px'}}></span>
            Publicidad Franquicia
          </button>
        </div>
      </div>
    </div>
  );
}