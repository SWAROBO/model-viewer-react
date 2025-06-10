import { renderHook, waitFor } from '@testing-library/react';
import { useModelData } from './useModelData';
import { vi, Mock } from 'vitest'; // Import vi and Mock
import Papa from 'papaparse'; // Import Papa to mock it
import { defaultModelViewerProps } from '../types/modelViewer'; // Import default props

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch); // Use vi.stubGlobal for mocking globals

// Declare a variable to hold the mock instance of Papa.parse
// Use 'var' to ensure it's hoisted and accessible by the vi.mock factory.
var mockPapaParse: Mock;

// Mock papaparse
vi.mock('papaparse', () => {
  const parseMock = vi.fn(); // Create the mock function
  mockPapaParse = parseMock; // Capture the mock instance
  return {
    default: { // Provide a default export for Papa
      parse: mockPapaParse, // The parse function is part of the default export
    },
  };
});

describe('useModelData Hook', () => {
  const CSV_URL = 'http://test.com/data.csv';
  const MOCK_CSV_CONTENT = 'header1,header2\nvalue1,value2';
  const MOCK_PARSED_DATA = [{ header1: 'value1', header2: 'value2' }];

  beforeEach(() => {
    mockFetch.mockClear();
    mockPapaParse.mockClear(); // Use the captured mock instance

    // Default mock for fetch: always resolve successfully with dummy content
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(MOCK_CSV_CONTENT),
    });

    // Default mock for Papa.parse: always complete successfully
    mockPapaParse.mockImplementation((text: string, config: Papa.ParseConfig) => { // Explicitly type parameters
      if (config.complete) { // Add null check
        config.complete({
          data: MOCK_PARSED_DATA,
          errors: [],
          meta: {
            delimiter: ',',
            linebreak: '\n',
            aborted: false,
            truncated: false,
            cursor: text.length,
          }
        }, undefined); // Pass second argument (file)
      }
    });
  });

  it('should return initial loading state', () => {
    const { result } = renderHook(() => useModelData(CSV_URL));

    expect(result.current.modelData).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch and parse CSV data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(MOCK_CSV_CONTENT),
    });

    const { result } = renderHook(() => useModelData(CSV_URL));

    // Wait for loading to become false and data to be populated
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(CSV_URL);
    expect(mockPapaParse).toHaveBeenCalledTimes(1); // Use the captured mock instance
    expect(mockPapaParse).toHaveBeenCalledWith(MOCK_CSV_CONTENT, expect.any(Object));
    expect(result.current.modelData).toEqual(MOCK_PARSED_DATA);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    const errorMessage = 'Network error';
    mockFetch.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useModelData(CSV_URL));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.current.modelData).toEqual([]);
    expect(result.current.error).toBe(errorMessage); // Error message from fetch
  });

  it('should handle PapaParse errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(MOCK_CSV_CONTENT),
    });
    const parseErrorMessage = 'Parsing failed';
    mockPapaParse.mockImplementation((text: string, config: any) => { // Cast config to any to resolve type error
      if (config.error) { // Add null check
        config.error({ message: parseErrorMessage, type: 'ParseError', code: 'CustomError', row: 0 }, undefined); // Pass second argument (file)
      }
    });

    const { result } = renderHook(() => useModelData(CSV_URL));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockPapaParse).toHaveBeenCalledTimes(1); // Use the captured mock instance
    expect(result.current.modelData).toEqual([]);
    expect(result.current.error).toBe(parseErrorMessage);
  });

  it('should parse comma-separated numbers into arrays', async () => {
    const csvContent = 'rotation,position,scale\n"1,2,3","4,5,6","0.1,0.2,0.3"';
    const expectedData = [{
      rotation: [1, 2, 3],
      position: [4, 5, 6],
      scale: [0.1, 0.2, 0.3]
    }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(csvContent),
    });
    mockPapaParse.mockImplementationOnce((text: string, config: Papa.ParseConfig) => {
      if (config.complete) {
        config.complete({
          data: expectedData,
          errors: [],
          meta: {
            delimiter: ',',
            linebreak: '\n',
            aborted: false,
            truncated: false,
            cursor: text.length,
          }
        }, undefined);
      }
    });

    const { result } = renderHook(() => useModelData(CSV_URL));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.modelData).toEqual(expectedData);
  });

  it('should remove extra quotes from splatURL', async () => {
    const csvContent = 'splatURL\n"\"http://test.com/model.splat\""';
    const expectedData = [{
      splatURL: 'http://test.com/model.splat'
    }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(csvContent),
    });
    mockPapaParse.mockImplementationOnce((text: string, config: Papa.ParseConfig) => {
      if (config.complete) {
        config.complete({
          data: expectedData,
          errors: [],
          meta: {
            delimiter: ',',
            linebreak: '\n',
            aborted: false,
            truncated: false,
            cursor: text.length,
          }
        }, undefined);
      }
    });

    const { result } = renderHook(() => useModelData(CSV_URL));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.modelData).toEqual(expectedData);
  });

  it('should use defaultModelViewerProps for null/undefined values', async () => {
    const csvContent = 'fov,distance\n,'; // fov and distance are null/undefined
    const expectedData = [{
      fov: defaultModelViewerProps.fov,
      distance: defaultModelViewerProps.distance
    }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(csvContent),
    });
    mockPapaParse.mockImplementationOnce((text: string, config: Papa.ParseConfig) => {
      if (config.complete) {
        config.complete({
          data: [{ fov: null, distance: undefined }], // Simulate null/undefined from PapaParse
          errors: [],
          meta: {
            delimiter: ',',
            linebreak: '\n',
            aborted: false,
            truncated: false,
            cursor: text.length,
          }
        }, undefined);
      }
    });

    const { result } = renderHook(() => useModelData(CSV_URL));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.modelData).toEqual(expectedData);
  });

  it('should re-fetch data when csvUrl changes', async () => {
    const NEW_CSV_URL = 'http://test.com/new-data.csv';
    const NEW_CSV_CONTENT = 'new_header,new_value\nnew_data,new_data_value';
    const NEW_PARSED_DATA = [{ new_header: 'new_data', new_value: 'new_data_value' }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(MOCK_CSV_CONTENT),
    });
    mockPapaParse.mockImplementationOnce((text: string, config: Papa.ParseConfig) => {
      if (config.complete) {
        config.complete({
          data: MOCK_PARSED_DATA,
          errors: [],
          meta: {
            delimiter: ',',
            linebreak: '\n',
            aborted: false,
            truncated: false,
            cursor: text.length,
          }
        }, undefined);
      }
    });

    const { result, rerender } = renderHook(({ url }) => useModelData(url), {
      initialProps: { url: CSV_URL },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.modelData).toEqual(MOCK_PARSED_DATA);

    // Change csvUrl
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(NEW_CSV_CONTENT),
    });
    mockPapaParse.mockImplementationOnce((text: string, config: Papa.ParseConfig) => {
      if (config.complete) {
        config.complete({
          data: NEW_PARSED_DATA,
          errors: [],
          meta: {
            delimiter: ',',
            linebreak: '\n',
            aborted: false,
            truncated: false,
            cursor: text.length,
          }
        }, undefined);
      }
    });

    rerender({ url: NEW_CSV_URL });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(NEW_CSV_URL);
    expect(mockPapaParse).toHaveBeenCalledTimes(2);
    expect(result.current.modelData).toEqual(NEW_PARSED_DATA);
  });
});
