import { expect, test } from "@playwright/test";
import { evaluateFreshShelfStatus } from "../lib/fresh-shelf";

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
