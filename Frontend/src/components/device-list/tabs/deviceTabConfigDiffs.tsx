import React, { useEffect, useMemo, useState } from 'react';
import {
  type DeviceRecord,
  fetchConfigDifferences,
  fetchConfigHistory,
  type DeviceConfigDifferences,
  type DeviceConfigHistoryEntry,
} from '../../../api/devices';

interface DeviceTabConfigDiffsProps {
  device: DeviceRecord;
  deviceIpLabel: string;
  hasDeviceIp: boolean;
}

const normalizeConfigLines = (config: string): string[] => {
  if (!config) {
    return [];
  }
  const lines = config.split('\n');
  if (lines.length > 0 && lines[0].trim() === '') {
    lines.shift();
  }
  if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }
  return lines;
};

const DeviceTabConfigDiffs: React.FC<DeviceTabConfigDiffsProps> = ({
  device,
  deviceIpLabel,
  hasDeviceIp,
}) => {
  const [differences, setDifferences] =
    useState<DeviceConfigDifferences | null>(null);
  const [historyEntries, setHistoryEntries] = useState<
    DeviceConfigHistoryEntry[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [indexInput, setIndexInput] = useState('0');

  const maxIndex = historyEntries.length;

  useEffect(() => {
    setHistoryIndex(0);
    setIndexInput('0');
  }, [device.mac]);

  useEffect(() => {
    if (!hasDeviceIp) {
      setDifferences(null);
      setHistoryEntries([]);
      setDiffError(null);
      setHistoryError(null);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setDifferences(null);
    setHistoryEntries([]);
    setDiffError(null);
    setHistoryError(null);

    Promise.allSettled([
      fetchConfigDifferences(deviceIpLabel),
      fetchConfigHistory(deviceIpLabel),
    ])
      .then(([diffResult, historyResult]) => {
        if (!isActive) {
          return;
        }

        if (diffResult.status === 'fulfilled') {
          setDifferences(diffResult.value);
        } else {
          setDiffError(
            diffResult.reason instanceof Error
              ? diffResult.reason.message
              : 'Unable to load config differences.'
          );
        }

        if (historyResult.status === 'fulfilled') {
          setHistoryEntries(historyResult.value);
        } else {
          setHistoryError(
            historyResult.reason instanceof Error
              ? historyResult.reason.message
              : 'Unable to load config history.'
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [deviceIpLabel, hasDeviceIp]);

  useEffect(() => {
    if (historyIndex > maxIndex) {
      setHistoryIndex(maxIndex);
      setIndexInput(String(maxIndex));
    }
  }, [historyIndex, maxIndex]);

  const addedLineIndexes = useMemo(
    () => new Set(differences?.added_lines_indexes ?? []),
    [differences]
  );

  const historyEntry =
    historyIndex > 0 ? historyEntries[historyIndex - 1] : null;

  const rightPaneError = historyIndex === 0 ? diffError : historyError;

  const rightPaneLines =
    historyIndex === 0
      ? differences?.deleted_lines ?? []
      : normalizeConfigLines(historyEntry?.configuration ?? '');

  const updateHistoryIndex = (nextIndex: number) => {
    const clamped = Math.min(Math.max(nextIndex, 0), maxIndex);
    setHistoryIndex(clamped);
    setIndexInput(String(clamped));
  };

  const handleIndexCommit = () => {
    const parsed = Number.parseInt(indexInput, 10);
    if (Number.isNaN(parsed)) {
      setIndexInput(String(historyIndex));
      return;
    }
    updateHistoryIndex(parsed);
  };

  const handleIndexKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleIndexCommit();
    }
  };

  const currentConfigLines = differences?.full_config_lines ?? [];

  return (
    <div className="step-section">
      {!hasDeviceIp ? (
        <div className="panel">
          <h3>Config differences</h3>
          <p className="muted-text">
            No IP address is available for this device.
          </p>
        </div>
      ) : (
        <div className="config-diffs-grid">
          <div className="panel config-pane">
            <div className="config-pane__header">
              <div>
                <h3>Current config</h3>
                <p className="muted-text">
                  Green lines were added in the latest config.
                </p>
              </div>
              {isLoading && (
                <span className="muted-text">Loading...</span>
              )}
            </div>
            {diffError ? (
              <p className="panel__error">{diffError}</p>
            ) : currentConfigLines.length === 0 ? (
              <div className="config-lines config-lines--empty">
                <p className="muted-text">No config lines to display.</p>
              </div>
            ) : (
              <div className="config-lines">
                {currentConfigLines.map((line, index) => {
                  const isAdded = addedLineIndexes.has(index);
                  return (
                    <div
                      key={`current-${index}`}
                      className={`config-line ${
                        isAdded ? 'config-line--added' : ''
                      }`}
                    >
                      <span className="config-line__number">
                        {index + 1}
                      </span>
                      <span className="config-line__content">{line}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="panel config-pane">
            <div className="config-pane__header">
              <div>
                <h3>
                  {historyIndex === 0
                    ? 'Last config (removed lines)'
                    : `Archived config #${historyIndex}`}
                </h3>
                <p className="muted-text">
                  {historyIndex === 0
                    ? 'Lines removed from the current config.'
                    : historyEntry
                    ? `ID ${historyEntry.id} | ${historyEntry.queried_at}`
                    : 'Select a history entry to view.'}
                </p>
              </div>
              <div className="config-pane__nav">
                <button
                  type="button"
                  className="inline-button"
                  onClick={() => updateHistoryIndex(historyIndex - 1)}
                  disabled={historyIndex <= 0}
                  aria-label="Previous config"
                >
                  &larr;
                </button>
                <div className="config-pane__index">
                  <input
                    type="number"
                    min={0}
                    max={maxIndex}
                    value={indexInput}
                    onChange={(event) => setIndexInput(event.target.value)}
                    onKeyDown={handleIndexKeyDown}
                    onBlur={() => setIndexInput(String(historyIndex))}
                  />
                  <span className="config-pane__index-total">
                    / {maxIndex}
                  </span>
                </div>
                <button
                  type="button"
                  className="inline-button"
                  onClick={() => updateHistoryIndex(historyIndex + 1)}
                  disabled={historyIndex >= maxIndex}
                  aria-label="Next config"
                >
                  &rarr;
                </button>
              </div>
            </div>
            {rightPaneError ? (
              <p className="panel__error">{rightPaneError}</p>
            ) : rightPaneLines.length === 0 ? (
              <div className="config-lines config-lines--empty">
                <p className="muted-text">
                  {historyIndex === 0
                    ? 'No removed lines found.'
                    : 'No archived config available.'}
                </p>
              </div>
            ) : (
              <div className="config-lines">
                {rightPaneLines.map((line, index) => (
                  <div
                    key={`history-${historyIndex}-${index}`}
                    className={`config-line ${
                      historyIndex === 0 ? 'config-line--deleted' : ''
                    }`}
                  >
                    <span className="config-line__number">
                      {index + 1}
                    </span>
                    <span className="config-line__content">{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceTabConfigDiffs;
