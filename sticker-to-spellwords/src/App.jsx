import React, { useState } from "react";
import "./App.css";

function minStickerCost(stickers, target, categoryLimits) {
  if (!target) return 0;

  target = target.toLowerCase();

  const chars = [...new Set(target)];
  const m = chars.length;

  const index = new Map();
  chars.forEach((ch, i) => index.set(ch, i));

  const targetCount = new Array(m).fill(0);

  for (const ch of target) {
    targetCount[index.get(ch)]++;
  }

  const usefulStickers = [];

  for (const sticker of stickers) {
    const count = new Array(m).fill(0);

    for (const ch of sticker.word.toLowerCase()) {
      if (index.has(ch)) {
        count[index.get(ch)]++;
      }
    }

    if (count.some((x) => x > 0)) {
      usefulStickers.push({
        count,
        cost: Number(sticker.cost),
        category: Number(sticker.category),
      });
    }
  }

  
  for (let i = 0; i < m; i++) {
    let found = false;

    for (const sticker of usefulStickers) {
      if (sticker.count[i] > 0) {
        found = true;
        break;
      }
    }

    if (!found) return -1;
  }

  const memo = new Map();

  function encode(remaining, usage) {
    return (
      remaining.join(",") +
      "|" +
      [...usage.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([category, used]) => `${category}:${used}`)
        .join(";")
    );
  }

  function isComplete(remaining) {
    return remaining.every((x) => x === 0);
  }

  function dfs(remaining, usage) {
    if (isComplete(remaining)) {
      return 0;
    }

    const key = encode(remaining, usage);

    if (memo.has(key)) {
      return memo.get(key);
    }

    
    let pivot = -1;

    for (let i = 0; i < m; i++) {
      if (remaining[i] > 0) {
        pivot = i;
        break;
      }
    }

    let best = Infinity;

    for (const sticker of usefulStickers) {
      //
      if (sticker.count[pivot] === 0) {
        continue;
      }

      const category = sticker.category;
      const used = usage.get(category) || 0;
      const limit = categoryLimits[category];

      // Check category limit
      if (limit !== undefined && used >= limit) {
        continue;
      }

      const next = remaining.map((value, i) =>
        Math.max(0, value - sticker.count[i])
      );

      const nextUsage = new Map(usage);
      nextUsage.set(category, used + 1);

      const result = dfs(next, nextUsage);

      if (result !== Infinity) {
        best = Math.min(best, sticker.cost + result);
      }
    }

    memo.set(key, best);

    return best;
  }

  const answer = dfs(targetCount, new Map());

  return answer === Infinity ? -1 : answer;
}

export default function App() {
  const [target, setTarget] = useState("thehat");

  const [stickers, setStickers] = useState([
    {
      word: "with",
      cost: 2,
      category: 0,
    },
    {
      word: "example",
      cost: 3,
      category: 0,
    },
    {
      word: "science",
      cost: 4,
      category: 1,
    },
  ]);

  const [limits, setLimits] = useState({
    0: 10,
    1: 10,
  });

  const [result, setResult] = useState(null);

  function solveProblem() {
    const answer = minStickerCost(stickers, target, limits);
    setResult(answer);
  }

  function addSticker() {
    setStickers([
      ...stickers,
      {
        word: "",
        cost: 1,
        category: 0,
      },
    ]);
  }

  function updateSticker(index, field, value) {
    const updated = [...stickers];

    updated[index] = {
      ...updated[index],
      [field]: field === "word" ? value : Number(value),
    };

    setStickers(updated);
  }

  function removeSticker(index) {
    setStickers(stickers.filter((_, i) => i !== index));
  }

  function updateLimit(category, value) {
    setLimits({
      ...limits,
      [category]: Number(value),
    });
  }

  return (
    <div className="app">
      <div className="container">

        <div className="header">
          <h1>Sticker Word Solver</h1>

          <p>
            Find the minimum cost required to spell the target word.
          </p>
        </div>

        <div className="card">
          <label className="label">
            Target Word
          </label>

          <input
            className="input target-input"
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Enter target word"
          />
        </div>

        <div className="card">
          <div className="section-header">
            <h2>Stickers</h2>

            <button
              className="secondary-btn"
              onClick={addSticker}
            >
              + Add Sticker
            </button>
          </div>

          {stickers.map((sticker, index) => (
            <div className="sticker-row" key={index}>

              <input
                className="input"
                placeholder="Sticker word"
                value={sticker.word}
                onChange={(e) =>
                  updateSticker(
                    index,
                    "word",
                    e.target.value
                  )
                }
              />

              <input
                className="input small-input"
                type="number"
                min="1"
                placeholder="Cost"
                value={sticker.cost}
                onChange={(e) =>
                  updateSticker(
                    index,
                    "cost",
                    e.target.value
                  )
                }
              />

              <input
                className="input small-input"
                type="number"
                min="0"
                placeholder="Category"
                value={sticker.category}
                onChange={(e) =>
                  updateSticker(
                    index,
                    "category",
                    e.target.value
                  )
                }
              />

              <button
                className="delete-btn"
                onClick={() => removeSticker(index)}
              >
                ×
              </button>

            </div>
          ))}
        </div>

        <div className="card">
          <h2>Category Limits</h2>

          {Object.entries(limits).map(([category, limit]) => (
            <div className="limit-row" key={category}>

              <span>
                Category {category}
              </span>

              <input
                className="input small-input"
                type="number"
                min="0"
                value={limit}
                onChange={(e) =>
                  updateLimit(
                    category,
                    e.target.value
                  )
                }
              />

            </div>
          ))}
        </div>

        <button
          className="solve-btn"
          onClick={solveProblem}
        >
          Calculate Minimum Cost
        </button>

        {result !== null && (
          <div
            className={
              result === -1
                ? "result error"
                : "result success"
            }
          >

            {result === -1 ? (
              <>
                <span className="result-icon">
                  ✕
                </span>

                <div>
                  <strong>Impossible</strong>

                  <p>
                    The target cannot be created
                    with the available stickers.
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className="result-icon">
                  ✓
                </span>

                <div>
                  <strong>
                    Minimum Cost: {result}
                  </strong>

                  <p>
                    The target can be formed successfully.
                  </p>
                </div>
              </>
            )}

          </div>
        )}

      </div>
    </div>
  );
}