import React from 'react';
import { Card, CardBody } from 'react-bootstrap';
import CountUp from 'react-countup';

interface BudgetStatisticCardProps {
    title: string;
    subtitle: string;
    stats: string | number;
    icon: React.ReactNode;
    variant?: string;
}

const BudgetStatisticCard: React.FC<BudgetStatisticCardProps> = ({ title, subtitle, stats, icon, variant }) => {
    const isNumber = !isNaN(parseFloat(String(stats))) && isFinite(Number(stats));
    const endValue = isNumber ? parseFloat(String(stats)) : 0;
    const prefix = typeof stats === 'string' && stats.startsWith('$') ? '$' : '';
    const suffix = typeof stats === 'string' && stats.endsWith('M') ? 'M' : '';

    return (
        <Card
            className={`border-0 shadow-sm`}
            style={{
                borderRadius: 16,
                minHeight: 110,
                background:
                    variant === 'info'
                        ? 'linear-gradient(135deg, #5fd0d6 0%, #38c0d4 100%)'
                    : variant === 'primary'
                        ? 'linear-gradient(135deg, #7eb6f8 0%, #3c83f6 100%)'
                    : variant === 'warning'
                        ? 'linear-gradient(135deg, #ffe082 0%, #ffd54f 100%)'
                    : variant === 'secondary'
                        ? 'linear-gradient(135deg, #b0b4b9 0%, #868f96 100%)'
                    : '#f8fafc',
            }}
        >
            <CardBody style={{ minHeight: 90, position: 'relative', padding: '1.25rem 1.25rem 1rem 1.25rem' }}>
                <div className="d-flex flex-column justify-content-between h-100">
                    <div>
                        <h3 className="mb-1 text-white">
                            {isNumber ? (
                                <CountUp prefix={prefix} suffix={suffix} duration={1} end={endValue} separator="," />
                            ) : (
                                stats
                            )}
                        </h3>
                        <div className="d-flex align-items-center mb-1">
                            <span className="me-2" style={{
                                color: '#fff',
                                opacity: 0.95
                            }}>
                                {icon}
                            </span>
                            <span className="fw-bold text-white">{title}</span>
                        </div>
                        <div className="text-white-50 small">{subtitle}</div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default BudgetStatisticCard; 