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
        // Check for a mocked version of the hook for E2E testing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).__MOCKED_USE_MODEL_DATA__) {
            console.log("Using mocked useModelData for E2E test.");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mockedData = (window as any).__MOCKED_USE_MODEL_DATA__(csvUrl);
            setModelData(mockedData.modelData);
            // Assuming defaultModelViewerProps is also part of the mock or can be derived
            // For now, we'll just use the default from the type definition if not explicitly mocked
            // If the mock provides it, use it, otherwise fall back to the default import
            // This might need refinement based on how the mock is structured
            setLoading(false);
            return; // Exit early if mocked
        }

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
                    complete: (results: Papa.ParseResult<Record<string, string>>) => {
                        const parsedData: CsvRow[] = results.data.map((row: Record<string, string>) => {
                            const newRow: Partial<CsvRow> = {}; // Use Partial for initial construction
                            for (const key in row) {
                                if (Object.prototype.hasOwnProperty.call(row, key)) {
                                    let value: string | number | number[] | undefined = row[key];
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
                                            const defaultValue = defaultModelViewerProps[trimmedKey];
                                            if (typeof defaultValue === 'string' || typeof defaultValue === 'number' || Array.isArray(defaultValue)) {
                                                value = defaultValue;
                                            }
                                        }
                                    }
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    (newRow as Record<string, any>)[key.trim()] = value; // Cast to any for assignment
                                }
                            }
                            // Ensure 'model' property is always present, even if empty string
                            if (!newRow.model) {
                                newRow.model = '';
                            }
                            return newRow as CsvRow;
                        });
                        setModelData(parsedData);
                        setLoading(false);
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    error: (err: any) => {
                        console.error("PapaParse Error:", err);
                        setError(err.message);
                        setLoading(false);
                    }
                });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
