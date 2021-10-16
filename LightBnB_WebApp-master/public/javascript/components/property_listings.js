$(() => {

  const $propertyListings = $(`
  <section class="property-listings" id="property-listings">
      <p>Loading...</p>
    </section>
  `);
  window.$propertyListings = $propertyListings;

  window.propertyListings = {};

  function addListing(listing) {
    $propertyListings.append(listing);
  }
  function clearListings() {
    $propertyListings.empty();
  }
  window.propertyListings.clearListings = clearListings;

  function addProperties(properties, isReservation = false) {
    // if it's a reservation, we don't want to clear the listings a second time in the addProperties function call
    if (!isReservation) {
      clearListings();
    }
    // check for user login
    getMyDetails()
    .then(() => {
      for (const propertyId in properties) {
        const property = properties[propertyId];
        const listing = propertyListing.createListing(property, isReservation);
        addListing(listing);
      }
      if (isReservation) {
        $('.update-button').on('click', function() {
          const idData = $(this).attr('id').substring(16);
          getIndividualReservation(idData).then(data => {
            views_manager.show("updateReservation", data);       
          });
        })
        $('.delete-button').on('click', function() {
          const idData = $(this).attr('id').substring(16);
          deleteReservation({reservation_id: idData})
          .then(() => {
            $(this).parent().parent().parent().remove();
            console.log('Success!');
          })
          .catch(err => console.error(err));        
        })
        $('.add-review-button').on('click', function() {
          const idData = $(this).attr('id').substring(11);
          views_manager.show("newReview", idData);
        })
      } else {
        $('.reserve-button').on('click', function() {
          const idData = $(this).attr('id').substring(17);
          views_manager.show('newReservation', idData);
        })
        $('.review_details').on('click', function() {
          const idData = $(this).attr('id').substring(15);
          views_manager.show('showReviews', idData);
        })
      }
    })
    .catch(err => console.log('getMyDetails() failed: ', err));
  }

  window.propertyListings.addProperties = addProperties;

});