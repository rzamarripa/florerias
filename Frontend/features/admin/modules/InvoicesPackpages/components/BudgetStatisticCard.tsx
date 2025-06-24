import React from 'react';
import { Card } from 'react-bootstrap';
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
        <Card className={`bg-${variant} text-white`}>
            <Card.Body style={{ minHeight: 120, position: 'relative' }}>
                <div className="d-flex flex-column justify-content-between h-100">
                    <div>
                        <h3 className="mb-1">
                            {isNumber ? (
                                <CountUp prefix={prefix} suffix={suffix} duration={1} end={endValue} separator="," />
                            ) : (
                                stats
                            )}
                        </h3>
                        <div className="d-flex align-items-center mb-1">
                            {icon}
                            <span className="ms-2 fw-bold">{title}</span>
                        </div>
                        <div className="text-white-50 small">{subtitle}</div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default BudgetStatisticCard; 