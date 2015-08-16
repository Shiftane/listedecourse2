'use strict';

/**
 * Module dependencies.
 */
var 
  mongoose = require('mongoose'),
  //Recipe = mongoose.model('recipe'),
  cheerio = require('cheerio'),
  request = require('request'),
  async = require('async'),
  //config = require('meanio').loadConfig();
  searchresultCtrl = require('./searchresults'),
  providers = require('../providers.json');

//var url = 'http://www.marmiton.org/recettes/recherche.aspx?aqt=';
var logoUrl = 'http://images.marmitoncdn.org/Skins/1/Common/Images/favicon.ico';


// UNITIES AND SEPARATOR FOR PARSER
var textToReplace = [{textOri : ',', textFinal : '.'},{textOri : 'environ', textFinal : ''}];
var unities = ['cuillère à café', ' tasse ', ' tasses ', ' grosses cuillères à café ', ' cuillères à café ', ' kg ',' g ', ' louche ', ' louches ', ' cube ', 'feuilles', 'ml', ' pot ', ' petit pot ', ' litre ', 'cuillère à soupe', 'cuillères à soupe', ' dosette ', ' gousses ', ' gousse ', ' quelque ', ' quelques ', ' paquet ', ' cl ', ' pincée ', 'Gr '];
var separator = ['de', 'd\'', 'du'];
var minmaxSeparator = 'à';

/*
 * Method to parse result from Marmiton with cheerio
*/
var parseSearchResponse = function(body, url, provider){
  console.log('Request done : TRY TO PARSE IT');
    var results = [];
    var $ = cheerio.load(body);

    var searchResults = $(provider.searchOptions.resultsPath);
    
    $(searchResults).each(function(i, link){

      // GET INFORMATION FROM CONFIG in providers.json
      var newRecipe = {};
      newRecipe.providerName = provider.name;
      newRecipe.providerBasedUrl = provider.basedUrl;
      newRecipe.providerLogoUrl = provider.logoUrl;
      newRecipe.calledUrl = url;
      newRecipe.title = $(provider.searchOptions.resultTitle,link).text().trim();
      newRecipe.link = $(provider.searchOptions.resultLinkToRecipe, link).attr('href');

      // Remove the basedURL
      if(newRecipe.link)newRecipe.link = newRecipe.link.replace(provider.basedUrl, '');
      
      results.push(newRecipe);
    });
    return results;
};

/*
 * Method to eval unity
*/

var evalQuantity = function(quantityStr){
  /*
   *   Try to find a division quantity
   */
  var slashIndex = quantityStr.indexOf('/');
  if (slashIndex > -1){
    var returnIngredient = {};
    var dividende = parseInt(quantityStr.substring(0,slashIndex));
    var diviseur = parseInt(quantityStr.substring(slashIndex+1, quantityStr.length));
    returnIngredient.quantity = parseFloat(eval(String(dividende + '/' + diviseur)));
    returnIngredient.product = quantityStr.replace(String(dividende + '/' + diviseur), '').trim();
    console.log('EVAL OK : ' + JSON.stringify(returnIngredient));
    return returnIngredient;
  }else if(isNaN(parseInt(quantityStr))){
    console.log('Etrange ingredient : ' + quantityStr);
  }else{
    console.log('Etrange ingredient : ' + quantityStr);
  }
  return;
};

var getProviderbyName = function(providerName){
  for (var i = 0; i < providers.providers.length; i=i+1) {
    var provider = providers.providers[i];
    if(provider.name === providerName){
      return provider;
    }
  }
};

var parseRecette = function(body, recetteUrl, providerName){
  var $ = cheerio.load(body);
  var provider = getProviderbyName(providerName);
  console.log('Provider of Recipe : ' + JSON.stringify(provider));
  //console.log('BODY PARSED BY CHEERIO : ' + body);
  var recette = $(provider.recipeOptions.recettePath); //use your CSS selector here
  var newRecipe = {};
  newRecipe.title = $(provider.recipeOptions.titlePlaceHolder,recette).text().trim();
  console.log('test m ' + $(provider.recipeOptions.titlePlaceHolder,recette));
  newRecipe.prepTime = $(provider.recipeOptions.prepTimePlaceHolder, recette).text().replace('min', '').trim();
  newRecipe.cookingTime = $(provider.recipeOptions.cookTimePlaceHolder, recette).text().replace('min', '').trim();
  newRecipe.image = $(provider.recipeOptions.image, recette).attr('src');
  newRecipe.description = $(provider.recipeOptions.descriptionPlaceHolder, recette).html();

  console.log('Recipe Main info : ' + JSON.stringify(newRecipe));

  // People Number finder
  var nbrPersonsStr = $(provider.recipeOptions.peoplePlaceHolder, recette).text();
  var nbrPersons;
  for (var i = provider.recipeOptions.peopleParser.length - 1; i >= 0; i = i -1) {
    var parser = provider.recipeOptions.peopleParser[i];
    var startIndex = parser.indexOf('{')-1;
    var endStr = parser.substring(parser.indexOf('}')+1, parser.length);
    var stopIndex = nbrPersonsStr.indexOf(endStr);
    nbrPersons = nbrPersonsStr.substring(startIndex,stopIndex).trim();
    console.log(nbrPersonsStr + '--> start = ' + startIndex + ' | end ' + endStr + ' | stop ' + stopIndex);
    if(startIndex !== -1 && stopIndex !== -1){
      break;
    }
  }
  console.log('Number of people : ' + nbrPersons);

  // Ingredients
  var ingredientsStr = [];

  switch(provider.recipeOptions.ingredientsParsingMethod){
    case 'DashMethod' :
      $(provider.recipeOptions.toDeleteBeforeParsing, recette).remove();
      ingredientsStr = $(provider.recipeOptions.ingredientPlaceHolder, recette).text().trim().split('- ');
      
      break;
    case 'ListMethod' :
      ingredientsStr =  $(provider.recipeOptions.ingredientPlaceHolder, recette).map(function() {
                          return $(this).text();
                        }).get();
      break;
    default :

  }
  
  var ingredients = [];
  console.log('Ingredients : ' + ingredientsStr);

  ingredientsStr.forEach(function(ingredientStr, i){
    
    if(ingredientStr === ''){
      return;
    }

    // Start with replace text in ingredients
    textToReplace.forEach(function(toReplace){
      ingredientStr = ingredientStr.replace(toReplace.textOri, toReplace.textFinal);
    });

    var ingredient = {};
    var nbrUnityFound = 0;

    console.log('1) Parsing with unities : ' + ingredientStr.trim());
    /*
     * FIRST : Try to split with unity table
     */
    unities.forEach(function(unity, i){
      
      var resultIndex = ingredientStr.indexOf(unity);
      if(resultIndex > -1){
        // IF UNITY EXIST
        ingredient.unity = ingredientStr.substring(resultIndex, resultIndex + unity.length).trim();
        if(resultIndex !== 0){
          // get only the quantity part
          var quantityStr = ingredientStr.substring(0, resultIndex).trim();
          // FIND a "à"" in the middle to separate min and max value
          // ex. "250 à 300 gr de confiture"
          var startIndex = 0;
          if(quantityStr.indexOf(minmaxSeparator) > -1){
            startIndex = quantityStr.indexOf(minmaxSeparator)+1;
          }
          try{
            ingredient.quantity = eval(quantityStr.substring(startIndex, quantityStr.length).trim());
          }catch(e){
            console.log(e);
          }
          
        }
        ingredient.product = ingredientStr.substring(resultIndex + unity.length, ingredientStr.length).trim();
        separator.forEach(function(element, index){
          var pos = ingredient.product.indexOf(element);
          if(pos === 0){
            ingredient.product = ingredient.product.substring(element.length, ingredient.product.length);
          }
        });
        nbrUnityFound = nbrUnityFound+1;
      }
      
    });

    if(nbrUnityFound === 0){
      console.log('2) Parsing with evaluation of quantity  : ' + ingredientStr.trim());
      var result = evalQuantity(ingredientStr);
      if (result){
        ingredient = result;
        ingredient.unity = 'pcs';
        console.log('Parsing SUCCESS : ' + JSON.stringify(ingredient));
      }else{
        console.log('3) Parsing with of parseInt  : ' + ingredientStr.trim());
        var quantity = parseInt(ingredientStr);
        if(!isNaN(quantity)){
          ingredient.product = ingredientStr.trim().replace(quantity, '').trim();
          ingredient.unity = 'pcs';
          ingredient.quantity = quantity;
        }else{
          console.log('?) Etrange ingredient  : ' + ingredientStr.trim());
          ingredient.product = ingredientStr.trim();
        }
      }
    }else if(nbrUnityFound === 1){
      console.log('Parsing SUCCESS : ' + ingredientStr + ' ==> ' + JSON.stringify(ingredient));
    }else{
      console.log('Plusieurs unités pour cet ingrédient : ' + ingredientStr + ' | ' + unities);
    }
    

    console.log('ingredient : ' + JSON.stringify(ingredient));
    ingredients.push(ingredient);
    
  });
  
  

  var contenu = {
      nbrPersons : nbrPersons,
      ingredients : ingredients
  };
  newRecipe.contenu = contenu;

  
  var response = {
      origin : provider.name,
      recipeUrl : recetteUrl,
      logoUrl : provider.logoUrl,
      message: 'Parsing finished',
      result: newRecipe,
      status: 'success'
  };
  return response;
};

/**
 * Get detail Recette with cheerio
 */
exports.getRecette = function(req, res){  
  var recetteUrl = req.params.url;
  var providerName = req.params.providerName;
  //var recetteProvider = req.params.provider;
  console.log('Try to reach : ' + providerName + ' / ' + recetteUrl);
  
  var options = {
    url: recetteUrl,
    headers: {
        'User-Agent': 'Mozilla/5.0'
      },
    timeout : 3000
  };
  request(options, function(err, resp, body){
    if(err){
      //Case if the Marmiton website is NOT available
      console.log('Request done : ERORR --> ' + err);
      var cachedResults = searchresultCtrl.searchresultbyUrl(recetteUrl);
      console.log('Try to get from cache');
      cachedResults.exec(function(err, searchresults){
        if (err) {
          console.log('Error getting from cache : ' + err);
          return {
            error: 'Cannot find searchresults with URL = ' + recetteUrl
          };
        }
        console.log('get from cache success ' + searchresults[0]);
        //console.log('Result from cache : ' + searchresults);
        if(searchresults.length > 0){
          body = searchresults[0].resultsHTML;
          console.log('Result get from CACHE : extract --> ' + body.substring(50));
          res.json(parseRecette(body, recetteUrl));
        }else{
          // NO manner to get Recipe
          var response = {
              origin : 'Marmiton',
              baseUrl : 'http://www.marmiton.org',
              recipeUrl : recetteUrl,
              logoUrl : logoUrl,
              message: err,
              status: 'error'
          };
          res.json(response);
        }
      });
    }else{
      // SAVE RESULT IN DB
      var searchresults = {searchURL:recetteUrl,resultsHTML:body};
      var createResult = searchresultCtrl.create(searchresults, req.user);
      if(createResult && createResult.error){
        console.log(createResult.error);
      }
      console.log('Result Saved in cache');

      //Case if the Marmiton website is available
      console.log('Request done : TRY TO PARSE IT  URL= ' + recetteUrl);
      res.json(parseRecette(body, recetteUrl, providerName));
    }
  });
  
};

/**
 * Search in Marmiton
 */
exports.search = function(req, res) {
  var searchTerm = req.params.q;
  console.log('SearchTerm : ' + searchTerm);

  // START TO SEARCH ON MARMITON
  // Specific Addition of word in marmiton with "-"
  var results = [];
  var errors = [];
  var q = async.queue(function (task, done) {
    request(task.options, function(err, resp, body) {
      //console.log(JSON.stringify(task));
      var url = task.options.url;
      var provider = task.provider;
      if(err){
        // We get from the cache if Marmiton is down
        console.log('Request done : ERORR --> ' + err);
        var cachedResults = searchresultCtrl.searchresultbyUrl(url);
        console.log('Try to get from cache');
        cachedResults.exec(function(err, searchresults){
          if (err) {
            console.log('Error getting from cache : ' + err);
            errors.push('Cannot find searchresults with URL = ' + url);
            return; 
          }
          console.log('get from cache success ' + searchresults.length);
          // + searchresults[0]);
          //console.log('Result from cache : ' + searchresults);
          if(searchresults.length > 0){
            body = searchresults[0].resultsHTML;
            //console.log('Result get from CACHE : extract --> ' + body.substring(50));
            results.push.apply(results, parseSearchResponse(body, url, provider));
          }else{
            errors.push(err);
          }
        });
      }else{
        // Marmiton is available, we save the result in DB and parse the content
        console.log(url + ' REACHED SUCCESSFULY');
        // SAVE RESULT IN DB
        var searchresults = {searchURL:url,resultsHTML:body};
        var createResult = searchresultCtrl.create(searchresults, req.user);
        if(createResult && createResult.error){
          console.log(createResult.error);
        }
        console.log('Result Saved in cache');
        results.push.apply(results, parseSearchResponse(body, url, provider));
      }
      done();
    });
  }, 5);
  var urlsToCall = [];

  providers.providers.forEach(function(provider){
    //console.log(provider);
    var urltoCall = provider.url + searchTerm.replace(' ', provider.spaceCharReplacement);
    console.log('Try to reach : ' + urltoCall);
    var options = {
      url: urltoCall,
      headers: {
          'User-Agent': 'Mozilla/5.0'
        },
        timeout : 5000
    };  
    urlsToCall.push({options: options, provider : provider});
  });
  //console.log(urlsToCall);
  q.push(urlsToCall, function(err){
    if(err){
      console.log('Provider error ' + err);
    }else{
      console.log('Provider Processed SUCCESSFULY !');
    }
  });

  q.drain = function(){
    console.log('terminated : ' + JSON.stringify(results));
    results.sort(function(a, b){
      if(a.title < b.title) return -1;
      if(a.title > b.title) return 1;
      return 0;
    });
    res.json({results:results, errors : errors});
  };
  
  
};


