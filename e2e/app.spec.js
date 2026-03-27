import { test, expect } from '@playwright/test'

const STORY = {
  asA: 'customer support manager',
  iWant: 'to export weekly incident summaries',
  soThat: 'I can reduce weekly reporting time by 40%',
}

const CRITERIA = [
  `Given the user is on the incident export page
When they click the Export weekly summary button
Then the system downloads a CSV file with all incidents from the last 7 days
And the file name includes the current week start date`,

  `Given a user selects a date range with no incidents
When they start the export
Then the system shows a message that there is no data for the range
And no file is downloaded`,

  `Given an export is in progress
When the request takes longer than 5 seconds
Then the system shows a loading indicator with an accessible live region message`,
]

test.describe('Agile Story Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear()
      } catch {
        /* ignore */
      }
    })
  })

  test('loads the page with title and main heading', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Agile Story Builder/)
    await expect(
      page.getByRole('heading', { name: /Agile Story Builder/i }),
    ).toBeVisible()
  })

  test('completes story draft → final score and criteria draft → final score', async ({
    page,
  }) => {
    await page.goto('/')

    await page.getByLabel(/as a/i).fill(STORY.asA)
    await page.getByLabel(/i want/i).fill(STORY.iWant)
    await page.getByLabel(/so that/i).fill(STORY.soThat)
    await page.getByRole('button', { name: /score draft story/i }).click()

    await expect(
      page.getByRole('heading', { name: /draft story score/i }),
    ).toBeVisible()

    await page.getByRole('button', { name: /confirm story/i }).click()
    await expect(page.getByText(/story confirmed/i)).toBeVisible()

    await page
      .getByRole('button', { name: /calculate final story score/i })
      .click()

    await expect(
      page.getByRole('heading', {
        name: /step 2 of 2: write acceptance criteria/i,
      }),
    ).toBeVisible()

    await page.locator('#criterion-0').fill(CRITERIA[0])
    await page.locator('#criterion-1').fill(CRITERIA[1])
    await page.locator('#criterion-2').fill(CRITERIA[2])

    await expect(page.getByText(/criteria filled:\s*3/i)).toBeVisible()

    const submitDraft = page.getByRole('button', { name: /score draft criteria/i })
    await submitDraft.scrollIntoViewIfNeeded()
    await page.locator('#criterion-2').blur()
    // requestSubmit runs full HTML5 constraint validation and reliably pairs with React onSubmit
    await submitDraft.evaluate((btn) => {
      if (!(btn instanceof HTMLButtonElement) || !btn.form) {
        throw new Error('Score Draft Criteria button is not inside a form')
      }
      btn.form.requestSubmit(btn)
    })

    await expect(
      page.getByRole('heading', { name: /draft criteria score/i }),
    ).toBeVisible()

    await page.getByRole('button', { name: /confirm criteria/i }).click()
    await expect(page.getByText(/criteria confirmed/i)).toBeVisible()

    await page
      .getByRole('button', { name: /calculate final criteria score/i })
      .click()

    await expect(
      page.getByRole('heading', { name: /your criteria score/i }),
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: /start new story/i }),
    ).toBeVisible()
  })
})
