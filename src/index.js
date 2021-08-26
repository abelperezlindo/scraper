const puppeteer = require('puppeteer');
const fs = require('fs')
const request = require('request')



let scrape = async (url) => {
    const browser = await puppeteer.launch({ 
        executablePath: '/usr/bin/google-chrome-stable',
        headless: false 
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    try{
        await page.goto(url, [1000, { waitUntil: "domcontentloaded" }]);
        
        let relacionados = await page.evaluate(() => {
            let related = new Array();
            let links = document.querySelector('#block-system-main > div > div > div.field.field-name-field-temas-relacionados.field-type-taxonomy-term-reference.field-label-above');
            if(links){
                links = links.getElementsByTagName('a');
            } else {
                links = new Array();
            }
            for (let item of links){
                let r = item.innerText.toLowerCase();
                r =  r[0].toUpperCase() + r.slice(1);
                console.log(r);
                related.push(r);
            }
            return related;
        });

        relacionados.forEach(element => console.log('related: ' + element));

        await page.waitForSelector('body');
        data = {
            "seccion" : await page.evaluate(() => document.querySelector('#block-system-main > div > div > div.field.field-name-field-seccion.field-type-taxonomy-term-reference.field-label-hidden > div > div > a').innerText),
            "titulo"  : await page.evaluate(() => document.querySelector('#content-wrapper > h1.page-title').innerText),
            "imagen"  : await page.evaluate(() => document.querySelector('#block-system-main > div > div > div.field.field-name-field-imagen-principal.field-type-image.field-label-hidden > div > div > picture > img').getAttribute('src').replace('/', '')),
            "filename" : Math.random().toString(36).substr(2, 9) + ".png",
            "fecha"   : await page.evaluate(() => document.querySelector('#block-system-main > div > div > span.submitted-by').innerText),
            "cuerpo"  : await page.evaluate(() => document.querySelector('#block-system-main > div > div > div.field.field-name-body.field-type-text-with-summary.field-label-hidden').innerHTML),
            "relacionados": relacionados
        }

       

        await page.goto(data.imagen);
        await page.waitForSelector('body');
        const elem = await page.$('body > img');
        const boundingBox = await elem.boundingBox();
        console.log('boundingBox', boundingBox);
        const image = await page.screenshot({
            path: data.filename,
            clip: boundingBox
        });

        await page.close();
        let  pageToUp = await  browser.newPage();
        await pageToUp.goto('http://digital.ga/user/login', {waitUntil: 'networkidle0'});
        await pageToUp.waitForSelector('body');
        await pageToUp.type('#edit-name', '');
        await pageToUp.type('#edit-pass', '');
        await pageToUp.click('#edit-submit', {delay: 1000});
        await pageToUp.waitForTimeout(5000);
        await pageToUp.goto('http://digital.ga/node/add/noticia', {waitUntil: 'networkidle0'});
        await pageToUp.waitForTimeout(1000);

        await pageToUp.type('#edit-title-0-value', data.titulo);
        let value = await getOptionValue(data.seccion);
        await pageToUp.select('#edit-field-seccion', value);
        //body
        await pageToUp.type('#edit-body-0-value', data.cuerpo);

        await pageToUp.click('#edit-field-imagen-principal-selection-0-remove-button', {delay: 1000});
        await pageToUp.waitForTimeout(2000);
        await pageToUp.click('input.js-media-library-open-button', {delay: 1000});
        await pageToUp.waitForTimeout(2000);

        await pageToUp.waitForSelector('input[type=file]');
        await pageToUp.waitForTimeout(3000);

        // get the ElementHandle of the selector above
        const inputUploadHandle = await pageToUp.$('input[type=file]');

        // prepare file to upload, I'm using test_to_upload.jpg file on same directory as this script
        // Photo by Ave Calvar Martinez from Pexels https://www.pexels.com/photo/lighthouse-3361704/
        //let fileToUpload = 'test_to_upload.jpg';

        // Sets the value of the file input to fileToUpload
        await inputUploadHandle.uploadFile(data.filename);

        await pageToUp.waitForTimeout(3000);

        await pageToUp.waitForSelector('input[data-drupal-selector=edit-media-0-fields-field-media-image-0-alt]');
        

        await pageToUp.type('input[data-drupal-selector=edit-media-0-fields-field-media-image-0-alt]', 'John');
        await pageToUp.waitForTimeout(2000);

        await pageToUp.click('div.ui-dialog-buttonset.form-actions > button:nth-child(2)');
        await pageToUp.waitForTimeout(2000);

        //await pageToUp.click('button.button.button--primary.js-form-submit.form-submit');
        //await pageToUp.waitForTimeout(1000);
        
        let iter = 0;
        let arr = data.relacionados;
        for (let item of arr){
            let att = 'input[data-drupal-selector=edit-field-temas-relacionados-' + iter + '-target-id]';
            await pageToUp.type(att, item);
            await pageToUp.waitForTimeout(500);
            //data-drupal-selector=edit-field-temas-relacionados-add-more
            await pageToUp.click('input[data-drupal-selector=edit-field-temas-relacionados-add-more]');
            await pageToUp.waitForTimeout(3000);
            iter++;
        }


        await pageToUp.click('#edit-submit');
        await pageToUp.waitForTimeout(4000);
        fs.unlink(data.filename, () => console.log('Imagen borrada'));
        //await pageToUp.evaluate();

        //await browser.close();
        console.log(data);
    }catch(e){
        console.log(e);
    }
    
}

let getOptionValue = async (opt) =>{
    opt = opt.toLowerCase();
    if(opt === 'archivo') return '11';
    if(opt === 'cultura') return '5';
    if(opt === 'deportes') return '1';
    if(opt === 'economia') return '2';
    if(opt === 'interés general') return '10';
    if(opt === 'judiciales') return '3';
    if(opt === 'locales') return '9';
    if(opt === 'nacionales') return '7';
    if(opt === 'opinión') return '6';
    if(opt === 'policiales') return '4';
    if(opt === 'provinciales') return '8';

    return '_none';
}


scrape("https://www.analisisdigital.com.ar/judiciales/2021/08/22/juicio-los-monos-el-fiscal-bajo-buscar-una-pizza-con-un-chaleco-antibalas");
