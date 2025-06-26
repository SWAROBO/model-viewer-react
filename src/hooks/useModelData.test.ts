/// <reference types="vitest/globals" />
import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest'; // Explicitly import vi
import { useModelData } from './useModelData';
import Papa from 'papaparse';

// Mock global fetch
global.fetch = vi.fn();

// Mock papaparse to allow spying on its parse method
vi.mock('papaparse', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = (await importOriginal()) as Record<string, any>;
  return {
    ...actual,
    parse: vi.fn(), // Mock the parse method
  };
});

describe('useModelData', () => {
  let papaParseSpy: vi.SpyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on Papa.parse for each test
    papaParseSpy = vi.spyOn(Papa, 'parse');
  });

  afterEach(() => {
    papaParseSpy.mockRestore(); // Restore the original implementation after each test
  });

  it('should fetch and parse model data successfully', async () => {
    const mockCsvText = `model,rotation,position,scale,splatURL
model1,"0,0,0","0,0,0","1,1,1","https://example.com/model1.splat"
model2,"10,20,30","1,2,3","2,2,2","https://example.com/model2.splat"`;

    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockCsvText,
    });

    // Mock Papa.parse implementation for this specific test
    papaParseSpy.mockImplementation((text: string, config: Papa.ParseConfig) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((config as any).complete) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (config as any).complete({
          data: [
            { model: 'model1', rotation: '0,0,0', position: '0,0,0', scale: '1,1,1', splatURL: '"https://example.com/model1.splat"' },
            { model: 'model2', rotation: '10,20,30', position: '1,2,3', scale: '2,2,2', splatURL: '"https://example.com/model2.splat"' },
          ],
          errors: [],
          meta: {},
        });
      }
    });

    const { result } = renderHook(() => useModelData('dummy.csv'));

    expect(result.current.loading).toBe(true);
    expect(result.current.modelData).toEqual([]);
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetch).toHaveBeenCalledWith('dummy.csv');
    expect(papaParseSpy).toHaveBeenCalledWith(mockCsvText, expect.any(Object));
    expect(result.current.modelData).toEqual([
      { model: 'model1', rotation: [0, 0, 0], position: [0, 0, 0], scale: [1, 1, 1], splatURL: 'https://example.com/model1.splat' },
      { model: 'model2', rotation: [10, 20, 30], position: [1, 2, 3], scale: [2, 2, 2], splatURL: 'https://example.com/model2.splat' },
    ]);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const { result } = renderHook(() => useModelData('nonexistent.csv'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetch).toHaveBeenCalledWith('nonexistent.csv');
    expect(papaParseSpy).not.toHaveBeenCalled(); // Papa.parse should not be called on fetch error
    expect(result.current.modelData).toEqual([]);
    expect(result.current.error).toBe('HTTP error! status: 404');
  });

  it('should handle papaparse error', async () => {
    const mockCsvText = `invalid,csv`;

    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockCsvText,
    });

    const mockParseError: Papa.ParseError = {
      type: 'Delimiter',
      code: 'UndetectableDelimiter',
      message: 'Parsing failed',
      row: 0,
      index: 0,
    };

    // Mock Papa.parse implementation for this specific test
    papaParseSpy.mockImplementation((text: string, config: Papa.ParseConfig) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((config as any).error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (config as any).error(mockParseError, undefined); // Pass undefined for file and input
      }
    });

    const { result } = renderHook(() => useModelData('invalid.csv'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetch).toHaveBeenCalledWith('invalid.csv');
    expect(papaParseSpy).toHaveBeenCalledWith(mockCsvText, expect.any(Object));
    expect(result.current.modelData).toEqual([]);
    expect(result.current.error).toBe('Parsing failed');
  });
});
