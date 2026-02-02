import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { LanguageSwitcher } from "./language-switcher";

// Mock next-intl
vi.mock("next-intl", () => ({
  useLocale: () => "ja",
}));

// Mock the dropdown menu to avoid portal issues in jsdom
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <button
      role="menuitem"
      onClick={onClick}
      className={className}
      data-testid={`menu-item-${children}`}
    >
      {children}
    </button>
  ),
}));

// Mock document.cookie
const mockCookie = {
  value: "",
};
Object.defineProperty(document, "cookie", {
  get: () => mockCookie.value,
  set: (v: string) => {
    mockCookie.value = v;
  },
  configurable: true,
});

// Mock window.location
const mockLocation = {
  href: "",
  pathname: "/",
  search: "",
};
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Helper to wait for component to mount
const waitForMount = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookie.value = "";
    mockLocation.href = "";
    mockLocation.pathname = "/";
    mockLocation.search = "";
  });

  it("should render globe button", async () => {
    render(<LanguageSwitcher />);
    await waitForMount();

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(screen.getByText("Change language")).toBeInTheDocument();
  });

  it("should render language options", async () => {
    render(<LanguageSwitcher />);
    await waitForMount();

    expect(screen.getByText("日本語")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("should set cookie when English is selected", async () => {
    render(<LanguageSwitcher />);
    await waitForMount();

    const englishOption = screen.getByTestId("menu-item-English");
    fireEvent.click(englishOption);

    expect(mockCookie.value).toContain("NEXT_LOCALE=en");
  });

  it("should navigate when language is changed", async () => {
    render(<LanguageSwitcher />);
    await waitForMount();

    const englishOption = screen.getByTestId("menu-item-English");
    fireEvent.click(englishOption);

    expect(mockLocation.href).toBe("/");
  });

  it("should not change anything when same locale is selected", async () => {
    render(<LanguageSwitcher />);
    await waitForMount();

    const japaneseOption = screen.getByTestId("menu-item-日本語");
    fireEvent.click(japaneseOption);

    // Cookie should not be set when same locale is selected
    expect(mockCookie.value).toBe("");
    expect(mockLocation.href).toBe("");
  });

  it("should highlight current locale in dropdown", async () => {
    render(<LanguageSwitcher />);
    await waitForMount();

    const jaOption = screen.getByTestId("menu-item-日本語");
    expect(jaOption).toHaveClass("bg-accent");
  });

  it("should have accessible label for screen readers", async () => {
    render(<LanguageSwitcher />);
    await waitForMount();

    expect(screen.getByText("Change language")).toHaveClass("sr-only");
  });
});
