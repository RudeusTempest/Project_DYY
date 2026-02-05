import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { type DeviceRecord } from '../../../api/devices';
import {
  addWhiteListWord,
  deleteWhiteListWord,
  fetchWhiteList,
  type WhiteListEntry,
} from '../../../api/whiteList';
import { type AlertItem, type AlertSocketStatus } from '../../../hooks/useAlerts';

interface DeviceTabWhiteListProps {
  device: DeviceRecord;
  alerts: AlertItem[];
  socketStatus: AlertSocketStatus;
  socketError: string | null;
  onClearAlerts: () => void;
}

const DeviceTabWhiteList: React.FC<DeviceTabWhiteListProps> = ({
  device,
  alerts,
  socketStatus,
  socketError,
  onClearAlerts,
}) => {
  const [whiteList, setWhiteList] = useState<WhiteListEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newWord, setNewWord] = useState('');
  const [pendingAction, setPendingAction] = useState<'add' | 'delete' | null>(
    null
  );
  const [pendingWord, setPendingWord] = useState<string | null>(null);

  const loadWhiteList = useCallback(
    async (showErrors = true) => {
      setIsLoading(true);
      if (showErrors) {
        setError(null);
        setMessage(null);
      }

      try {
        const list = await fetchWhiteList();
        setWhiteList(list);
      } catch (loadError) {
        if (showErrors) {
          const loadMessage =
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load the white list.';
          setError(loadMessage);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    setWhiteList([]);
    setNewWord('');
    setMessage(null);
    setError(null);
    loadWhiteList();
  }, [device.mac, loadWhiteList]);

  const sortedWords = useMemo(() => {
    return [...whiteList].sort((a, b) =>
      a.words.localeCompare(b.words)
    );
  }, [whiteList]);

  const socketLabel = useMemo(() => {
    switch (socketStatus) {
      case 'open':
        return 'Connected';
      case 'connecting':
        return 'Connecting';
      case 'closed':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  }, [socketStatus]);

  const socketStatusClass = useMemo(() => {
    switch (socketStatus) {
      case 'open':
        return 'status-chip--active';
      case 'error':
        return 'status-chip--unauthorized';
      default:
        return 'status-chip--inactive';
    }
  }, [socketStatus]);

  const handleAddWord = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanWord = newWord.trim();

    if (!cleanWord) {
      setError('Word is required.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to add "${cleanWord}" to the white list?`
    );
    if (!confirmed) {
      return;
    }

    setPendingAction('add');
    setError(null);
    setMessage(null);

    try {
      const response = await addWhiteListWord(cleanWord);
      setMessage(response.message ?? 'Word added successfully.');
      setNewWord('');
      await loadWhiteList(false);
    } catch (addError) {
      const addMessage =
        addError instanceof Error
          ? addError.message
          : 'Unable to add word.';
      setError(addMessage);
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteWord = async (word: string) => {
    const cleanWord = word.trim();
    if (!cleanWord) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to erase "${cleanWord}" from the white list?`
    );
    if (!confirmed) {
      return;
    }

    setPendingAction('delete');
    setPendingWord(cleanWord);
    setError(null);
    setMessage(null);

    try {
      const response = await deleteWhiteListWord(cleanWord);
      setMessage(response.message ?? 'Word deleted successfully.');
      await loadWhiteList(false);
    } catch (deleteError) {
      const deleteMessage =
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete word.';
      setError(deleteMessage);
    } finally {
      setPendingWord(null);
      setPendingAction(null);
    }
  };

  const handleClearAlerts = () => {
    onClearAlerts();
  };

  const handleRefresh = () => {
    loadWhiteList();
  };

  return (
    <div className="step-section">
      <div className="white-list__layout">
        <div className="white-list__column white-list__column--left">
          <div className="panel">
            <div className="panel__header-row">
              <div>
                <h3>White list</h3>
                <p className="muted-text">
                  Words listed here trigger an alert when configs change.
                </p>
              </div>
              <button
                type="button"
                className="nav-button nav-button--primary"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            {error && <p className="panel__error">{error}</p>}
            {message && <p className="view-panel__message">{message}</p>}
            {isLoading ? (
              <p className="muted-text">Loading words...</p>
            ) : sortedWords.length === 0 ? (
              <p className="muted-text">No words added yet.</p>
            ) : (
              <ul className="white-list__items">
                {sortedWords.map((entry, index) => (
                  <li
                    key={`${entry.words}-${index}`}
                    className="white-list__item"
                  >
                    <span className="white-list__word">{entry.words}</span>
                    <button
                      type="button"
                      className="white-list__delete"
                      onClick={() => handleDeleteWord(entry.words)}
                      disabled={
                        pendingAction === 'delete' &&
                        pendingWord === entry.words
                      }
                      aria-label={`Delete ${entry.words}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="white-list__column white-list__column--right">
          <div className="panel">
            <h3>Add a word</h3>
            <form className="white-list__form" onSubmit={handleAddWord}>
              <input
                type="text"
                value={newWord}
                onChange={(event) => setNewWord(event.target.value)}
                placeholder="Enter word or phrase"
                disabled={pendingAction === 'add'}
              />
              <button
                type="submit"
                className="nav-button nav-button--primary"
                disabled={!newWord.trim() || pendingAction === 'add'}
              >
                {pendingAction === 'add' ? 'Adding...' : 'Add word'}
              </button>
            </form>
            <p className="muted-text">
              Confirming adds the word immediately to the backend white list.
            </p>
          </div>

          <div className="panel">
            <div className="panel__header-row">
              <div>
                <h3>Live alerts</h3>
                <p className="muted-text">
                  Listening to websocket alerts at /white_list/ws/alerts.
                </p>
              </div>
              <div className="white-list__status">
                <span className={`status-chip ${socketStatusClass}`}>
                  {socketLabel}
                </span>
                <button
                  type="button"
                  className="inline-button"
                  onClick={handleClearAlerts}
                  disabled={alerts.length === 0}
                >
                  Clear
                </button>
              </div>
            </div>
            {socketError && <p className="panel__error">{socketError}</p>}
            {alerts.length === 0 ? (
              <p className="muted-text">No alerts received yet.</p>
            ) : (
              <ul className="white-list__alerts" aria-live="polite">
                {alerts.map((alert) => (
                  <li key={alert.id} className="white-list__alert">
                    <span className="white-list__alert-text">
                      {alert.message}
                    </span>
                    <span className="white-list__alert-time">
                      {alert.receivedAt}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceTabWhiteList;
