import { useState, useEffect, useCallback } from "react";

interface HintCooldownState {
  unlockedCount: number; // 1-4, how many hints are permanently unlocked
  countdowns: number[]; // [0, 0, 0, 0] for each hint tier, countdown in seconds
  isOnCooldown: boolean;
}

const HINT_COOLDOWN_SECONDS = 180; // 3 minutes
const STORAGE_KEY = "hintcode_hint_cooldown";

export function useHintCooldown(problemTitleSlug: string | undefined) {
  const [state, setState] = useState<HintCooldownState>({
    unlockedCount: 1,
    countdowns: [0, 0, 0, 0],
    isOnCooldown: false,
  });

  // Load state from localStorage on mount or when problem changes
  useEffect(() => {
    if (!problemTitleSlug) {
      setState({
        unlockedCount: 1,
        countdowns: [0, 0, 0, 0],
        isOnCooldown: false,
      });
      return;
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${problemTitleSlug}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(parsed);
      } else {
        setState({
          unlockedCount: 1,
          countdowns: [0, 0, 0, 0],
          isOnCooldown: false,
        });
      }
    } catch {
      setState({
        unlockedCount: 1,
        countdowns: [0, 0, 0, 0],
        isOnCooldown: false,
      });
    }
  }, [problemTitleSlug]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!problemTitleSlug) return;
    try {
      localStorage.setItem(`${STORAGE_KEY}_${problemTitleSlug}`, JSON.stringify(state));
    } catch {
      console.error("Failed to save hint cooldown state");
    }
  }, [state, problemTitleSlug]);

  // Timer effect: decrement countdowns every second
  useEffect(() => {
    if (!state.isOnCooldown) return;

    const interval = setInterval(() => {
      setState((prev) => {
        const newCountdowns = [...prev.countdowns];
        let anyCountdownActive = false;

        for (let i = 0; i < newCountdowns.length; i++) {
          if (newCountdowns[i] > 0) {
            newCountdowns[i]--;
            if (newCountdowns[i] > 0) {
              anyCountdownActive = true;
            } else if (i === prev.unlockedCount - 1) {
              // This tier's countdown just finished, unlock the next hint
              // Update will happen in the next state update
            }
          }
        }

        // Check if any countdown just finished, if so unlock next hint
        let newUnlockedCount = prev.unlockedCount;
        if (!anyCountdownActive && prev.unlockedCount < 4) {
          // Check if the current countdown is complete
          if (prev.countdowns[prev.unlockedCount - 1] === 1) {
            newUnlockedCount = Math.min(prev.unlockedCount + 1, 4);
          }
        }

        return {
          ...prev,
          countdowns: newCountdowns,
          unlockedCount: newUnlockedCount,
          isOnCooldown: anyCountdownActive || newUnlockedCount < 4,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isOnCooldown]);

  // Get hint for a specific number (1-4)
  const getHintStatus = useCallback(
    (hintNumber: 1 | 2 | 3 | 4) => {
      const isUnlocked = hintNumber <= state.unlockedCount;
      const countdown = isUnlocked && hintNumber === state.unlockedCount ? state.countdowns[hintNumber - 1] : 0;
      return {
        isUnlocked,
        countdown,
        isOnCooldown: countdown > 0,
      };
    },
    [state.unlockedCount, state.countdowns]
  );

  // Request next hint (only works if next hint is available)
  const requestHint = useCallback(
    (hintNumber: 1 | 2 | 3 | 4) => {
      if (hintNumber > state.unlockedCount) {
        return false; // Can't unlock this hint yet
      }

      // If this is not the last unlocked hint, it's already been used
      if (hintNumber < state.unlockedCount) {
        return true; // Already unlocked, can use
      }

      // This is the next hint to unlock
      if (hintNumber < 4) {
        // Start cooldown for the next hint
        setState((prev) => {
          const newCountdowns = [...prev.countdowns];
          newCountdowns[hintNumber - 1] = HINT_COOLDOWN_SECONDS;
          return {
            ...prev,
            countdowns: newCountdowns,
            isOnCooldown: true,
          };
        });
      } else {
        // This is hint 4, no cooldown after
        setState((prev) => ({
          ...prev,
          unlockedCount: 4,
          isOnCooldown: false,
        }));
      }

      return true;
    },
    [state.unlockedCount]
  );

  return {
    getHintStatus,
    requestHint,
    unlockedCount: state.unlockedCount,
    isOnCooldown: state.isOnCooldown,
  };
}
