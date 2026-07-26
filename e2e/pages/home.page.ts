import { expect, type Locator, type Page } from "@playwright/test";

export class HomePage {
  readonly voteSlipHeading: Locator;
  readonly confirmVotesButton: Locator;

  constructor(private readonly page: Page) {
    this.voteSlipHeading = page.getByRole("heading", {
      name: "Cupom de Votos",
    });
    this.confirmVotesButton = page.getByRole("button", {
      name: "Confirmar votos",
    });
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
    await this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/bets") && response.status() === 200,
      { timeout: 30_000 },
    );
  }

  async expectMarketsVisible(): Promise<void> {
    await expect(
      this.page.getByText("Brasil vs Argentina - Quem ganha?"),
    ).toBeVisible({ timeout: 30_000 });
  }

  async selectOddByTitle(title: string): Promise<void> {
    await this.page.getByRole("button", { name: new RegExp(title, "i") }).first().click();
  }

  async expectSelectionInSlip(title: string): Promise<void> {
    await expect(this.voteSlipHeading).toBeVisible();
    const slip = this.page
      .locator("aside")
      .filter({ has: this.voteSlipHeading });
    await expect(slip.getByText(title, { exact: true })).toBeVisible();
  }

  async confirmVotes(): Promise<void> {
    await this.confirmVotesButton.click();
  }

  async setStakeAmount(amount: number): Promise<void> {
    const stakeInput = this.page.getByPlaceholder("100");
    await stakeInput.fill(String(amount));
  }

  async openReturnExplainer(label: string): Promise<void> {
    await this.page.getByLabel(label).click();
  }

  async filterByCategory(category: string): Promise<void> {
    await this.page
      .getByRole("button", { name: new RegExp(category, "i") })
      .first()
      .click();
  }

  async expectMarketVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title)).toBeVisible({ timeout: 10_000 });
  }

  async expectMarketNotVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title)).not.toBeVisible({ timeout: 10_000 });
  }

  async expectOddDisabled(oddTitle: string): Promise<void> {
    await this.expectOddDisabledForBet(undefined, oddTitle);
  }

  async expectOddDisabledForBet(
    betTitle: string | undefined,
    oddTitle: string,
  ): Promise<void> {
    const scope = betTitle
      ? this.page.locator("article").filter({ hasText: betTitle })
      : this.page;
    const oddButton = scope
      .getByRole("button", { name: new RegExp(oddTitle, "i") })
      .first();
    await expect(oddButton).toBeDisabled();
  }
}
