const puppeteer = require('puppeteer');

let scrape = async (url) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    try{
        await page.goto(url, [1000, { waitUntil: "domcontentloaded" }]);
        await page.waitForSelector('body');
        data = {
            "seccion" : await page.evaluate(() => document.querySelector('#block-system-main > div > div > div.field.field-name-field-seccion.field-type-taxonomy-term-reference.field-label-hidden > div > div > a').innerText),
            "titulo"  : await page.evaluate(() => document.querySelector('#content-wrapper > h1.page-title').innerText),
            "imagen"  : await page.evaluate(() => document.querySelector('#block-system-main > div > div > div.field.field-name-field-imagen-principal.field-type-image.field-label-hidden > div > div > picture > img').getAttribute('src').replace('/', '')),
            "img-filename" : Math.random().toString(36).substr(2, 9),
            "fecha"   : await page.evaluate(() => document.querySelector('#block-system-main > div > div > span.submitted-by').innerText),
            "cuerpo"  : await page.evaluate(() => document.querySelector('#block-system-main > div > div > div.field.field-name-body.field-type-text-with-summary.field-label-hidden').innerHTML),
        }

        let img = await page.$('#block-system-main > div > div > div.field.field-name-field-imagen-principal.field-type-image.field-label-hidden > div > div > picture > img');
        //let img = await page.evaluate(() => document.querySelector('#block-system-main > div > div > div.field.field-name-field-imagen-principal.field-type-image.field-label-hidden > div > div > picture > img'));
        await img.screenshot({ path: 'captura.png' });

        await page.close();
        console.log(data);
    }catch(e){
        console.log(e);
    }
    
}


scrape("https://www.analisisdigital.com.ar/opinion/2021/08/25/es-poco-probable-que-los-perpetradores-enfrenten-la-justicia");
