import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  AdContainer,
  HeaderAd,
  SidebarAd,
  InFeedAd,
  ResultAd,
} from "./ad-container";

describe("AdContainer", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  describe("in test mode", () => {
    it("should render placeholder for banner size", () => {
      render(<AdContainer size="banner" testMode />);

      expect(screen.getByText("AD: 728x90 Banner")).toBeInTheDocument();
      expect(screen.getByRole("region")).toHaveAttribute(
        "aria-label",
        "Advertisement"
      );
    });

    it("should render placeholder for rectangle size", () => {
      render(<AdContainer size="rectangle" testMode />);

      expect(screen.getByText("AD: 300x250 Rectangle")).toBeInTheDocument();
    });

    it("should render placeholder for leaderboard size", () => {
      render(<AdContainer size="leaderboard" testMode />);

      expect(screen.getByText("AD: 970x90 Leaderboard")).toBeInTheDocument();
    });

    it("should render placeholder for native size", () => {
      render(<AdContainer size="native" testMode />);

      expect(screen.getByText("AD: Native Ad")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<AdContainer size="banner" testMode className="custom-class" />);

      const container = screen.getByRole("region");
      expect(container).toHaveClass("custom-class");
    });
  });

  describe("in production mode", () => {
    it("should render ad container with slot", () => {
      render(<AdContainer size="banner" slot="12345" testMode={false} />);

      const container = screen.getByRole("region");
      expect(container).toBeInTheDocument();
      expect(container.querySelector("ins.adsbygoogle")).toBeInTheDocument();
    });

    it("should not render ins element without slot", () => {
      render(<AdContainer size="banner" testMode={false} />);

      const container = screen.getByRole("region");
      expect(container.querySelector("ins.adsbygoogle")).not.toBeInTheDocument();
    });
  });
});

describe("HeaderAd", () => {
  it("should render with centered layout", () => {
    render(<HeaderAd />);

    const container = screen.getByRole("region").parentElement;
    expect(container).toHaveClass("flex", "justify-center");
  });

  it("should apply custom className", () => {
    render(<HeaderAd className="test-class" />);

    const container = screen.getByRole("region").parentElement;
    expect(container).toHaveClass("test-class");
  });
});

describe("SidebarAd", () => {
  it("should render with sticky layout", () => {
    render(<SidebarAd />);

    const container = screen.getByRole("region").parentElement;
    expect(container).toHaveClass("sticky", "top-20");
  });

  it("should be hidden on mobile", () => {
    render(<SidebarAd />);

    const container = screen.getByRole("region").parentElement;
    expect(container).toHaveClass("hidden", "lg:block");
  });
});

describe("InFeedAd", () => {
  it("should render with margin", () => {
    render(<InFeedAd />);

    const container = screen.getByRole("region").parentElement;
    expect(container).toHaveClass("my-4");
  });
});

describe("ResultAd", () => {
  it("should render with centered layout and margin", () => {
    render(<ResultAd />);

    const container = screen.getByRole("region").parentElement;
    expect(container).toHaveClass("flex", "justify-center", "my-6");
  });
});
