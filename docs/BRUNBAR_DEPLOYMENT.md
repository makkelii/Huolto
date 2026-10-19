# Brunbar.fi — erillinen julkaisu ja palautusohje

Tämä on valmisteluohje. Mitään vaihetta ei ole tehty tuotantoon automaattisesti. **585.fi:n sivustoa, Pages-asetuksia, DNS-vyöhykettä, proxyä, dokumenttijuurta tai julkaisua ei saa muuttaa.**

## Tarkistuslista ennen käyttöönottoa

1. Lue HOSTING_INSPECTION.md. Nykyisen Pages-palvelun asetuksia ei voitu vahvistaa API:n kautta. Selvitä nykyinen 585.fi:n ja brunbar.fi:n palvelukytkentä hallintapaneeleista vain lukemalla.
2. Varmuuskopioi vanha brunbar.fi-sivusto, sen julkaisuartefakti, palvelinasetukset ja **brunbar.fi:n** koko DNS-vyöhyke TTL-arvoineen. Kirjaa vanhan palvelimen IP/host ja palautustapa. Älä poista vanhaa brunbar-palvelua ennen hyväksyttyä käyttöönottoa.
3. Luo uusi GitHub-repositorio **`makkelii/huoltopilotti-brunbar`**. Älä käytä `makkelii/Huolto`- tai `makkelii.github.io`-Pages-sivustoa. Tämän työn aikana uutta repositoriota ei luoda.
4. Siirrä tarkastettu brunbar-valmisteluhaara uuteen tyhjään repositorioon. Se sisältää myös PR #2:n. Älä kopioi pelkkää nykyistä `Huolto/main`-haaraa, jos PR #2 on yhä yhdistämättä. Vaihtoehtona on hyväksyä ensin PR #2 ja sen jälkeen brunbar-muutokset lähderepositorioon. Älä käytä force-pushia tai korvaa uuden kohteen olemassa olevaa työtä.
5. Määritä Supabase PRIVATE_SETUP.md:n mukaan. Säilytä olemassa oleva tietokanta. Lisää uuden repositorion julkiset muuttujat ja tarkista, ettei mukana ole salaisia avaimia.
6. Määritä vain uuden repositorion Pages-lähteeksi **GitHub Actions** ja sen mukautetuksi verkkotunnukseksi **brunbar.fi**. Varmista oikea repo ja domain ennen tallentamista. Älä muuta muiden repositorioiden Pages-asetuksia.
7. Muuta vain brunbar.fi:n DNS tarvittaessa alla olevan taulukon mukaan. Ota HTTPS käyttöön sertifikaatin valmistuttua.
8. Käynnistä uuden repositorion **Deploy brunbar.fi (dedicated repository only)** käsin `main`-haarasta. Vahvistuskenttään `brunbar.fi`. Tarkista ensimmäisen julkaisun tulokset ja tee hyväksymistestit kahdella käyttäjällä.

## Lähdekoodin siirto erilliseen repositorioon

Luo kohde tyhjänä, ilman README- tai lisenssialustusta. Nouda ensin PR:n hyväksytty haara ja tarkista commit sekä muutokset. Esimerkin paikallinen `HEAD` tarkoittaa tätä tarkistettua brunbar-haaraa, ei vanhaa demo-mainia:

```sh
git remote add brunbar https://github.com/makkelii/huoltopilotti-brunbar.git
git ls-remote --heads brunbar
git push brunbar HEAD:main
```

Tee push vasta kun kohde on varmasti uusi ja tyhjä. Jos siellä on historiaa tai sisältöä, pysähdy ja integroi se erikseen; älä ylikirjoita tai force-pushaa. Kopiointi ei käynnistä julkaisua: työnkulussa ei ole push-triggeriä. GitHub-asetukset ja muuttujat eivät siirry Git-historian mukana.

## Uuden repositorion asetukset

| Asetus | Arvo |
| --- | --- |
| Repository | `makkelii/huoltopilotti-brunbar` |
| Pages source | GitHub Actions |
| Pages custom domain | `brunbar.fi` |
| Actions repository variable `VITE_SUPABASE_URL` | Olemassa olevan oikean Supabase-projektin julkinen URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Julkinen publishable-/anon-avain; ei service-role-/secret-avainta |
| `BRUNBAR_DEPLOYMENT_APPROVED` | `true` vasta kun eristys ja kohde on tarkistettu |
| Environment | `brunbar-production`, sallituksi haaraksi `main`; lisää halutessasi vaaditut hyväksyjät |
| Manual input `confirm_domain` | `brunbar.fi` |
| Build base | `/`, työnkulun asettama |

Workflow lukee uuden Pages-sivun asetukset ja pysähtyy, ellei custom domain ole brunbar.fi. Lukuoikeuden puuttuessa sitä ei ohiteta. Se ei aseta custom domainia automaattisesti. `CNAME` tulee tiedostosta `deploy/brunbar/CNAME` vain uuden kohteen julkaisuun. Tavallinen `npm run build` ei luo CNAME-tiedostoa.

Kumpaakaan työnkulkua ei käynnistetä tässä työssä. Lähderepositorion `Validate Huoltopilotti (no deployment)` suorittaa tarkistuksia mutta ei julkaise Pagesiin.

## DNS vain brunbar.fi:lle

Vahvista ajantasaiset arvot GitHubin ohjeesta ennen muutosta: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

| Nimi | Tyyppi | Arvo |
| --- | --- | --- |
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |
| `www` (valinnainen) | CNAME | `makkelii.github.io` |

Apexille voi käyttää palveluntarjoajan tukemaa ALIAS/ANAME-ratkaisua GitHubin ohjeen mukaan A-tietueiden sijaan. Älä lisää tavallista CNAMEa apexille, jos se estää MX/TXT-tietueet. Älä käytä GitHub-repositorion polkua DNS-kohteena.

Jos haluat IPv6:n, GitHubin nykyiset AAAA-arvot ovat `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`; varmista ne vielä dokumentaatiosta. Poista tai korvaa vain brunbar.fi:n ristiriitaiset vanhaan WWW-palveluun osoittavat A/AAAA/ALIAS-tietueet. Vanhaksi jäänyt AAAA voi ohjata IPv6-käyttäjät väärälle sivustolle.

Säilytä sähköpostin MX/SPF/DKIM/DMARC ja muut tarpeelliset TXT-tietueet. Älä muuta nimipalvelimia tai DNSSEC-asetuksia vain tämän siirron takia. Lisää GitHubin domain-varmennuksen TXT-arvo täsmälleen hallintapaneelin antamalla nimellä (esim. `_github-pages-challenge-makkelii.brunbar.fi`) ja arvolla; arvoa ei voi päätellä tästä ohjeesta. Älä poista 585.fi:n varmennuksia.

Laske brunbar.fi:n asiaankuuluvien WWW-tietueiden TTL esimerkiksi 300 sekuntiin etukäteen, jos mahdollista. Jo välimuistiin tallennettu vanha TTL on odotettava loppuun; DNS ja TLS-varmennus voivat viedä tunteja tai jopa 24–48 tuntia. Älä tulkitse yhtä paikallista selaintestiä maailmanlaajuiseksi valmistumiseksi.

## HTTPS ja toiminnan tarkistus

1. Odota uuden Pages-sivun DNS-tarkistuksen ja brunbar.fi-sertifikaatin valmistumista. Valitse **Enforce HTTPS** vain uudesta repositoriosta. Virhetilanteessa tarkista brunbar.fi:n A/AAAA/CNAME sekä mahdolliset CAA- ja proxy-asetukset, ei 585.fi:n asetuksia.
2. Avaa `https://brunbar.fi/`, `https://brunbar.fi/#assets` ja `https://brunbar.fi/?demo=1` puhtaassa selaimessa. Oikean sovelluksen otsikko on Huoltopilotti. Yksityisessä tilassa näkyy kirjautuminen, demossa synteettiset tiedot.
3. Varmista verkkotyökaluista, että JS/CSS latautuu `/assets/`-polusta ilman `/huolto/`-prefiksiä, virheitä tai vanhaan verkkotunnukseen osoittavia kutsuja. Testaa myös suora sivun päivitys hash-reitillä.
4. Testaa sähköpostin salasanapalautus ja kutsu: paluu `https://brunbar.fi/?auth=recovery` tai `?auth=invite`, ei vanhalle hostille. Testaa jaetut laitteet, huoltohistoria ja varasto kahdella erillisellä selaimella PRIVATE_SETUP.md:n mukaan.
5. Tarkista 585.fi vain lukemalla: sisältö, osoite, TLS ja vanha palvelukytkentä ovat ennallaan. Älä muuta sen asetuksia, jos brunbar-testit epäonnistuvat.

## Palautus brunbar.fi:ssä

- Jos DNS on jo siirretty mutta sovellus ei toimi, palauta **vain brunbar.fi:n** aiemmat WWW:n A/AAAA/CNAME/ALIAS-arvot ja TTL:t tallennetusta varmuuskopiosta. Palauta vanha brunbar-hostaus sen omassa erillisessä ympäristössä. Jos dokumenttijuuri on jaettu 585.fi:n kanssa, älä kirjoita siihen: palauta domainin reititys vanhalle tallennetulle brunbar-originille.
- Jos uusi Pages-sivusto toimii mutta tietty versio on virheellinen, tee korjaava/revert-commit uuden repositorion `main`-haaraan ja julkaise käsin samaan brunbar-kohteeseen. Älä force-pushaa historiaa.
- Aseta `BRUNBAR_DEPLOYMENT_APPROVED=false` estämään uudet manuaaliset julkaisut selvityksen ajaksi. Se ei muuta jo toimivaa sivustoa.
- Älä resetoi tai palauta tietokantaa frontendin palautuksen takia. Uusi käyttöliittymä käyttää samaa skeemaa kuin PR #2. Säilytä uudet oikeat huoltotiedot ja varastotapahtumat.
- Säilytä brunbarin domain-varmennus ja varo jättämästä DNS:ää osoittamaan irrotettuun Pages-domainiin. Jos poistat domainin uudesta Pages-sivusta, siirrä ensin sen DNS hallittuun vanhaan origin-palveluun.
- Älä peruuta, muokkaa tai julkaise mitään 585.fi:ssä osana palautusta. Jaetut Supabase-asetukset pidetään alkuperäisinä; uusi funktio on nimetty erikseen juuri tätä varten.
