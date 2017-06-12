angular
  .module('BlendLife')
  .controller('RecipeShowCtrl', RecipeShowCtrl);

RecipeShowCtrl.$inject = ['Recipe', '$stateParams', 'Comment', '$rootScope'];
function RecipeShowCtrl (Recipe, $stateParams, Comment, $rootScope) {
  const vm    = this;
  vm.createComment  = createComment;


  vm.getRecipe = getRecipe;
  function getRecipe() {
    Recipe
      .get({id: $stateParams.id})
      .$promise
      .then(recipe => {
        console.log('we here', recipe);
        vm.recipe = recipe;
      });
  }
  getRecipe();
  $rootScope.$on('New Comment', getRecipe);

  function createComment() {
    console.log('stateParams though', $stateParams);
    vm.comment.recipe_id = $stateParams.id;
    Comment
      .save({
        comment: vm.comment
      })
      .$promise
      .then(() => {
        $rootScope.$broadcast('New Comment');
      })
      .catch(err => {
        console.log(err);
      });
    // location.reload(true);
  }





}
