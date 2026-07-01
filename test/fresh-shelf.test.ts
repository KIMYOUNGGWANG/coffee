import { expect, test } from "@playwright/test";
import { evaluateFreshPeakWindow, evaluateFreshShelfStatus } from "../lib/fresh-shelf";

const baseNow = new Date("2026-06-19T12:00:00.000Z");

test.describe("evaluateFreshShelfStatus", () => {
  test("marks unopened beans as waiting during the early degassing window", () => {
    const status = evaluateFreshShelfStatus({
      roastDate: "2026-06-17",
      openedDate: null,
      fillLevel: 100,
      isFinished: false,
      now: baseNow,
    });

    expect(status.kind).toBe("waiting");
    expect(status.label).toBe("조금 기다려요");
    expect(status.reason).toContain("로스팅 후 2일");
  });

  test("marks beans in the fresh drinking window as drink now", () => {
    const status = evaluateFreshShelfStatus({
      roastDate: "2026-06-10",
      openedDate: "2026-06-12",
      fillLevel: 75,
      isFinished: false,
      now: baseNow,
    });

    expect(status.kind).toBe("drink_now");
    expect(status.label).toBe("지금 마시기 좋아요");
  });

  test("marks long-open or low-fill beans as finish soon", () => {
    const status = evaluateFreshShelfStatus({
      roastDate: "2026-05-20",
      openedDate: "2026-05-27",
      fillLevel: 25,
      isFinished: false,
      now: baseNow,
    });

    expect(status.kind).toBe("finish_soon");
    expect(status.label).toBe("마무리할 때");
    expect(status.reason).toContain("개봉 후 23일");
  });

  test("marks empty or finished beans as rebuy timing", () => {
    const status = evaluateFreshShelfStatus({
      roastDate: "2026-06-01",
      openedDate: "2026-06-02",
      fillLevel: 0,
      isFinished: true,
      now: baseNow,
    });

    expect(status.kind).toBe("rebuy");
    expect(status.label).toBe("다시 살 타이밍");
  });

  test("falls back to fill level when dates are missing or malformed", () => {
    const status = evaluateFreshShelfStatus({
      roastDate: "soon",
      openedDate: null,
      fillLevel: 15,
      isFinished: false,
      now: baseNow,
    });

    expect(status.kind).toBe("finish_soon");
    expect(status.reason).toContain("잔량");
  });
});

test.describe("evaluateFreshPeakWindow", () => {
  test("asks for roast date before estimating the peak window", () => {
    const window = evaluateFreshPeakWindow({
      roastDate: null,
      openedDate: null,
      now: baseNow,
    });

    expect(window.phase).toBe("unknown");
    expect(window.label).toBe("피크 추정 대기");
    expect(window.targetDate).toBeNull();
  });

  test("keeps very recent beans in the resting window", () => {
    const window = evaluateFreshPeakWindow({
      roastDate: "2026-06-17",
      openedDate: null,
      now: baseNow,
    });

    expect(window.phase).toBe("resting");
    expect(window.label).toBe("조금 더 쉬는 중");
    expect(window.targetDate).toBe("2026-06-22");
    expect(window.daysUntilTarget).toBe(3);
  });

  test("marks beans in the post-rest range as peak", () => {
    const window = evaluateFreshPeakWindow({
      roastDate: "2026-06-05",
      openedDate: "2026-06-07",
      now: baseNow,
    });

    expect(window.phase).toBe("peak");
    expect(window.label).toBe("피크 구간");
    expect(window.targetDate).toBe("2026-06-26");
  });

  test("nudges older beans toward finishing before the flavor fades", () => {
    const window = evaluateFreshPeakWindow({
      roastDate: "2026-05-20",
      openedDate: "2026-05-25",
      now: baseNow,
    });

    expect(window.phase).toBe("enjoy_now");
    expect(window.label).toBe("지금 마무리");
    expect(window.reason).toContain("로스팅 후 30일");
  });

  test("marks long-past roast dates as faded", () => {
    const window = evaluateFreshPeakWindow({
      roastDate: "2026-05-01",
      openedDate: "2026-05-10",
      now: baseNow,
    });

    expect(window.phase).toBe("fading");
    expect(window.label).toBe("피크 지남");
  });
});
