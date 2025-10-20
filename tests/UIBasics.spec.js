const { test, expect } = require('@playwright/test');

test('basics - using global fixture browser', async ({ browser }) => {

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('https://www.udemy.com/');

})

test('basics - using global fixture page', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/loginpagePractise/');
    console.log(await page.title());
    // expect(page).toHaveTitle('Rahul');
    await page.locator('#username').fill('rahulshettyacademy');
    await page.locator('#password').fill('learning');
    await page.locator('#terms').click();
    await page.locator('[name="signin"]').click();


})

test('login to Rahulshetty- negative', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/loginpagePractise/');
    console.log(await page.title());
    // expect(page).toHaveTitle('Rahul');
    await page.locator('#username').fill('rahulshettyacademy');
    await page.locator('#password').fill('learning1');
    await page.locator('#terms').click();
    await page.locator('[name="signin"]').click();
    console.log(await page.locator('div[style*= "block"]').textContent());
    await expect(await page.locator('div[style*= "block"]').textContent()).toContain('Incorrect')


})

test('login and perform actions', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/loginpagePractise/');
    console.log(await page.title());
    // expect(page).toHaveTitle('Rahul');
    const userName = page.locator('#username')
    await userName.fill('rahulshettyacademy');
    await page.locator('#password').fill('learning');
    await page.locator('#terms').click();
    await page.locator('[name="signin"]').click();
    // await page.locator('.card-body a').first().textContent();
    // await page.locator('.card-body a').last().textContent();
    // This is to access the first item in the results set
    await page.locator('.card-body a').nth(0).textContent();
    const titleCards = await page.locator('.card-body a').allTextContents();
    console.log(titleCards)
})


test('UI controls', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/loginpagePractise/');
    console.log(await page.title());
    // expect(page).toHaveTitle('Rahul');
    const userName = page.locator('#username')
    await userName.fill('rahulshettyacademy');
    await page.locator('#password').fill('learning');
    await page.locator('#terms').click();
    await page.locator('[name="signin"]').click();
    // await page.locator('.card-body a').first().textContent();
    // await page.locator('.card-body a').last().textContent();
    // This is to access the first item in the results set
    await page.locator('.card-body a').nth(0).textContent();
    const titleCards = await page.locator('.card-body a').allTextContents();
    console.log(titleCards)
})
