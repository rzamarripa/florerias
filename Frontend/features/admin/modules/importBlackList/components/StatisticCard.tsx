import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import CountUp from "react-countup";

interface StatisticCardProps {
    title: string;
    stats: string | number;
    icon: React.ReactNode;
    variant?: string;
}

const StatisticCard: React.FC<StatisticCardProps> = ({ title, stats, icon, variant }) => {
    // Determine if stats is a number for CountUp
    const isNumber = !isNaN(parseFloat(String(stats))) && isFinite(Number(stats));
    const endValue = isNumber ? parseFloat(String(stats)) : 0;

    // Determine if we should add a prefix like '$' or a suffix like 'M'
    const prefix = typeof stats === 'string' && stats.startsWith('$') ? '$' : '';
    const suffix = typeof stats === 'string' && stats.endsWith('M') ? 'M' : '';

    return (
        <Card>
            <Card.Body>
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                        <h3 className="mb-2">
                            <span>
                                {isNumber ? (
                                    <CountUp
                                        prefix={prefix}
                                        suffix={suffix}
                                        duration={1}
                                        end={endValue}
                                        separator=","
                                    />
                                ) : (
                                    stats
                                )}
                            </span>
                        </h3>
                        <p className="text-muted mb-0">{title}</p>
                    </div>
                    <div className="flex-shrink-0">
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: `rgba(var(--bs-${variant}-rgb), 0.1)`
                            }}
                        >
                            <span className={`text-${variant}`}>{icon}</span>
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default StatisticCard;