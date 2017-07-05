# Blend Life Front-end

#### WDI project 4

Created by Charles Jewell

## Project overview

This is the front-end for my fourth WDI project. The app is Blend life, which is a platform for people to create and discuss smoothie recipes. 

If you would like to check out the API behind this app, you can view the repository [here](https://github.com/cjewell47/blend-life-api "Blend Life API").


![recipe submit page](http://i.imgur.com/nXECmG4.png)

## Project brief

Create a full stack application with a Ruby on Rails back-end and an AngularJS front-end. It is required to:

* Connect your Rails back-end to an SQL database and interact with it
* Create at least two models in the SQL database, one being a user model
* Have user authentication where the user's details are stored in the User model in the database
* Create API routes with CRUD functionality using Rails that are to be consumed by the AngularJS front-end

## Built with

* JavaScript
* HTML
* CSS & SCSS
* AngularJS
* Tachyons

##### Dependencies:

* angular-ui-router
* angular-resource
* angular-jwt
* angular-messages
* angular-scroll
* colormix.js

## Planning

Having completed the API with Ruby on Rails I needed to think about the user flow of the app. This would give me a good idea of what the most essential pages of the site would be, and what the most important pieces of functionality would be. To do this I made a rough wireframe of the app.

![wireframe1](http://i.imgur.com/IO3Az2j.png)
![wireframe2](http://i.imgur.com/FS3ba0q.png)

As you can see from these sections of my wireframes, it is a very rough outline of what my app would go on to look like, but it shows what is required on each page. This was useful for me to know what functionality would have to included in each controller.

## Functionality

### Authentication

Firstly, as I set the JSON Web Token in our API I needed make the client side compatible with it. One part of this was to create an AuthInterceptor. This would allow outgoing requests from the client side to the API to have tokens added to their headers so that we protected endpoints can be accessed. Incoming requests would also need to be checked for tokens so that the tokens can be saved to local storage.

For this to work I needed to add the AuthInterceptor to the $http service.

```
Interceptor.$inject = ['$httpProvider'];
function Interceptor($httpProvider) {
  return $httpProvider.interceptors.push('AuthInterceptor');
}

```
This allows the AuthInterceptor to intercept all requests and responses. The AuthInterceptor looks like this:

```
AuthInterceptor.$inject = ['API', 'TokenService'];
function AuthInterceptor(API, TokenService) {
  return {
    request: function(config){
      const token = TokenService.getToken();

      if (config.url.indexOf(API) === 0 && token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    response: function(res){
      if (res.config.url.indexOf(API) === 0 && res.data.token) {
        TokenService.setToken(res.data.token);
      }
      return res;
    }
  };
}
```

As you can see, for outgoing requests, to our API (which has been injected) a token is added to the header of the request. In the response, the interceptor calls a function from my TokenService called setToken. The setToken function stores the token in the local storage, it looks like this:

```
  self.setToken = (token) => {
    return $window.localStorage.setItem('auth-token', token);
  };
```

It's from here that the token is fetched before it is stored in the header of outgoing requests.


You can see the benefits of using a token system, as when the user logs in or registers a function getUser is called, this is defined in the current user service and looks like this:

```
self.getUser = () => {
  const decoded = TokenService.decodeToken();
  if (decoded) {
  	 User
   	 .get({ id: decoded.id }).$promise
   	 .then(data => {
       self.currentUser = data;
       $rootScope.$broadcast('loggedIn');
    });
  }
};
```

This function retrieves the user data that is encoded within the token and sets the current user, to do this it calls on the decodeToken function in the Token Service, which looks like this:

```
self.decodeToken = () => {
  const token = self.getToken();
  return token ? jwtHelper.decodeToken(token) : null;
};

self.getToken = () => {
  return $window.localStorage.getItem('auth-token');
};
```

### Creating recipes

I knew when planning the user flow that the recipe submission page was going to one of the more complex sections of my app from a development perspective.

It included three of my models. Users would need to be able to submit a new recipe to the API, which belonged to them, and which included many ingredients. Furthermore, a colour property that is stored as a string of RGB number within the Recipe would need to be generated by mixing the colour properties that are stored within its ingredients.

Submitting the name and description of the recipe through a form was straightforward, and the recipe belonging to the current user was taken care of in the backend controller. 

The Recipe create function looked like this:

```
  function recipeCreate(){
    vm.selectedIngredient_ids = vm.selectedIngredients.map(function(a) {
      return a.id;
    });
    vm.recipe.ingredient_ids = vm.selectedIngredient_ids;
    vm.recipe.colour         = vm.combinationColor;

    if (vm.addRecipeForm.$valid) {
      Recipe
        .save({
          recipe: vm.recipe
        })
        .$promise
        .then(() => {
          $state.go('recipeIndex');
          vm.selectedIngredients = [];
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
```

The ingredient ids that are required are taken form the array of ingredient objects that are selected on the page, and the colour property is the mix of the colours that is displaying at the time of submission in the recipe icon with the ingredients that are selected at that time. The colour property can be seen when the icon of ingredient is hovered on, or once they have been clicked.

![selecting ingredient](http://i.imgur.com/F3dRCkj.png)

Carrot, cucumber and mango, that looks like an interesting combination!

#### Colour Mixing 

The colour mixing functionality required a plugin called ColorMix, I tried several different colour mixing plugins and this seemed one of the better ones. The code on the new recipe page looked like this:

```
function selectIngredient(event, ingredient) {
    if(vm.selectedIngredients.length < 8 || vm.selectedIngredients.indexOf(ingredient) !== -1) {
      vm.selectedIngredients.indexOf(ingredient) === -1 ? vm.selectedIngredients.push(ingredient) : vm.selectedIngredients.splice(vm.selectedIngredients.indexOf(ingredient), 1);
    } else {
      vm.IsClickEnable = false;
    }

    const colors = vm.selectedIngredients.map(ingredient => {
      const arr = ingredient.colour.split(/\s*,\s*/).map(Number);
      return new ColorMix.Color(arr[0], arr[1], arr[2]);
    });

    let percents = [];
    if(colors.length === 6) {
      percents = [17.5, 16.5, 16.5, 16.5, 16.5, 16.5];
    } else if (colors.length === 7) {
      percents = [14.8, 14.2, 14.2, 14.2, 14.2, 14.2, 14.2];
    } else {
      percents = new Array(colors.length).fill(100 / colors.length);
    }

    if (colors.length === 0) {
      vm.combinationColor = null;
      return;
    }

    const mix = ColorMix.mix(colors, percents);
    vm.combinationColor = `${mix.red}, ${mix.green}, ${mix.blue}`;

    if(vm.selectedIngredients.length === 0) {
      vm.combinationColor = '255, 255, 255';
    }
  }

```

From the selected ingredients, I retrieved the RGB numbers that were stored within, and split them. The ColorMix required all the R's be placed in one array, then all the G's and all the B's. It then required another array determing how much weighting in of the original colours should have in the new colour. This always had to add up to 100 - exactly. In JavaScript this proved problematic for certain numbers. As I only needed 8 ingredients, I only had to come up with solutions for 6 and 7, which I hardcoded in (forgive me). This then gave me the combination colour which would display at the top of the page in the icon, and would change whenever new ingredients were selected or deselected. It would also become the colour property of the recipe upon its submission. Whenever the icon colour changed upon selection or deselection the view window would scroll up to it, to show the change in colour. As you can see from the section of code at the top of the function, only 8 ingredients can be selected and the clicking is disabled when that is reached, apart from selected ingredients which can then be deselected.

![coloured icon](http://i.imgur.com/X3fUS5z.png)

This is after some (mostly orange coloured) ingredients have been selected.

### Recipe index

On the index page, all recipes initially display. However, once something is typed into the search bar only recipes containing that ingredient (or ingredients containing that combination of letters) will display. I thought that this would make for a good user experience, as if many recipes were uploaded you wouldn't want to scroll through so many recipes, you would want to search for recipes containing ingredients you enjoy. The code for this looked like this:

```
Recipe
    .query()
    .$promise
    .then(recipes => {
      vm.recipes = recipes;
      filterRecipes();
    });

  function filterRecipes() {
    const params = { ingredients:
    {
      name: vm.search
    }
    };
    vm.filtered = filterFilter(vm.recipes, params);
  }

  $scope.$watch(() => vm.search, filterRecipes);

  vm.filterRecipes = filterRecipes;
  
```

![empty search](http://i.imgur.com/JePvaeF.png)

Nope.

![search](http://i.imgur.com/GFtUkSW.png)

Blueberry is a popular ingredient!

### Form validation

For my forms, and especially my register form I thought it important to tell users if they were entering invalid information before they submitted and found it to be invalid. So I implemented some form validation. For I alerted users when they left our required information, but also when their password was too short:

```
ng-minlength="6"

```

Or when their password confirmation didn't match their origin password:

```
ng-pattern="vm.user.password"
```

Or when their email address didn't look like a valid email address:

```
ng-pattern="vm.emailValidate"
```
```
vm.emailValidate = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
```

This is a small touch, but I think it adds to the user experience on the site.



## Styling

To style my app I decided to try a CSS framework that I had not used before, called Tachyons. This framework uses classes for each different CSS property and should allow anyone looking at your HTML to immediately identify what styling is being applied to that element. 

```
class="br-100 b--black b--solid dib bw4 overflow-hidden"
 
```
For example this element has a border-radius of 100, a black solid border of width 4, and is displaying as inline-block.

I found Tachyons to be a easy to use framework if you fully commit to it, and resist creating new classes. Committing to Tachyons can make your code very easy to read and you know exactly what is happening to each element. However, for some sections I did not fully commit and made some of my own classes that mixed with the Tachyons. This made for some confusion with my styling at some points. 

## Further development

To further develop my app, there are a few things I would like to add.

* Users should be able to favourite recipes they enjoy.
* Users should be able to submit new ingredients, including choosing colours from a colour wheel that represent that ingredient.
* Users should be able to rate recipes, and then filter by rating.

## Check out the live app

To see what the app looks like you can check it out [here](http://intense-dusk-18560.herokuapp.com/ "Blend life").

If you would like to check out the API behind this app, you can view the repository [here](https://github.com/cjewell47/blend-life-api "Blend Life API").

Thank you!






