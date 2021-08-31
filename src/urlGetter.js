 
const puppeteer = require('puppeteer');
const fs = require('fs')
const request = require('request')



let getSectionsUrls = async (url) => {
    const browser = await puppeteer.launch({ 
        executablePath: '/usr/bin/google-chrome-stable',
        headless: false 
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 780 });
    try{
        await page.setDefaultNavigationTimeout(0); 
        await page.goto('http://www.google.com.ar/');
        await page.goto('http://www.analisisdigital.com.ar/',  [1000, { waitUntil: "domcontentloaded" }]);
        await page.waitForSelector('#main-navigation-inside > div > div > nav > ul');
        await page.waitForTimeout(500);
        
        let secciones = await page.evaluate(() => {
            let lista = new Array();
            let links = document.querySelector('#main-navigation-inside > div > div > nav > ul');
            if(links){
                links = links.getElementsByTagName('a');
            } else {
                links = new Array();
            }
            for (let item of links){
                lista.push(item.href);
            }
            return lista;
        });
        console.log('Las secciones son: ', secciones);
        page.close();
        browser.close();
        
        return secciones;
    } catch(err){
        console.log(err);
        return false;
    }
}


let getNewsLinks = async () => {
    const browser = await puppeteer.launch({ 
        executablePath: '/usr/bin/google-chrome-stable',
        headless: false 
    });
    try{
        const page = await browser.newPage();
        await page.setViewport({ width: 1324, height: 780 });
        await page.setDefaultNavigationTimeout(0); 
        // page.setPageLimitLoadingTime(30000);

        let secciones = await getSectionsUrls();
        if(secciones === false){ 
            console.log('Error al obtener el listado de secciones');
            return false;
        }
        var links = new Array();

        for (let iter = 0 ; iter < secciones.length ; iter++){

            let seccion = secciones[iter];
            console.log('Guardando links de seccion ' + seccion);
            await page.goto(seccion,  [1000, { waitUntil: "domcontentloaded" }]);
            await page.waitForSelector('body');
            
            let linksSeccion = await page.evaluate(() =>{ 
                let lista_total = new Array();
                let table = document.querySelector('#block-system-main > div > div > div.view-content > table > tbody');
                let links_s = table.getElementsByTagName('a');
                for (let item of links_s){
                    if(lista_total.indexOf(item.href) === -1) {
                       
                        lista_total.push(item.href);
                    }
                }
                return lista_total;
            });
            links = links.concat(linksSeccion);
        }
        console.log('links: ', links);
        await page.close();
        await browser.close();
        return links;
    } catch(err){
        console.log(err);
        return false;
    }
} 

module.exports = {
    getNewsLinks
};