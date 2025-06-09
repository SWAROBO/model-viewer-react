import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { ModelViewerProps, defaultModelViewerProps } from '../types/modelViewer';

type CsvRow = ModelViewerProps & {
    model: string;
};

export const useModelData = (csvUrl: string) => {
    const [modelData, setModelData] = useState<CsvRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCsvData = async () => {
            try {
                setLoading(true);
                const response = await fetch(csvUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const text = await response.text();
                Papa.parse(text, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results: Papa.ParseResult<any>) => {
                        const parsedData: CsvRow[] = results.data.map((row: any) => {
                            const newRow: { [key: string]: any } = {};
                            for (const key in row) {
                                if (Object.prototype.hasOwnProperty.call(row, key)) {
                                    let value = row[key];
                                    // Custom parsing for comma-separated numbers (e.g., rotation, position, scale)
                                    if (typeof value === 'string' && value.includes(',') && !isNaN(Number(value.split(',')[0].trim()))) {
                                        value = value.split(',').map((num: string) => Number(num.trim()));
                                    }
                                    // Remove extra quotes from splatURL if present
                                    if (key.trim() === 'splatURL' && typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
                                        value = value.substring(1, value.length - 1);
                                    }

                                    // Replace null or undefined values with defaults from defaultModelViewerProps
                                    if (value === null || value === undefined) {
                                        const trimmedKey = key.trim() as keyof ModelViewerProps;
                                        if (defaultModelViewerProps.hasOwnProperty(trimmedKey)) {
                                            value = defaultModelViewerProps[trimmedKey];
                                        }
                                    }
                                    newRow[key.trim()] = value;
                                }
                            }
                            return newRow as CsvRow;
                        });
                        setModelData(parsedData);
                        setLoading(false);
                    },
                    error: (err: any) => {
                        console.error("PapaParse Error:", err);
                        setError(err.message);
                        setLoading(false);
                    }
                });
            } catch (err: any) {
                console.error("Error fetching CSV:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchCsvData();
    }, [csvUrl]);

    return { modelData, loading, error, defaultModelViewerProps };
};
