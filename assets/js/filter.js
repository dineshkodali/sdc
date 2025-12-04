/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/
(function () {
  "use strict";

  $(document).ready(function () {

    if ($("#filterBtn").length > 0 && $("#filterDropdown").length > 0) {

      // ✅ OPEN / TOGGLE
      $("#filterBtn").on("click", function (e) {
        e.stopPropagation();
        $("#filterDropdown").toggleClass("d-none");
      });

      // ✅ CLOSE USING X  (THIS IS THE FIX)
      $(document).on("click", "#closeFilter", function (e) {
        e.preventDefault();
        e.stopPropagation();          // ✅ stop bubbling
        $("#filterDropdown").addClass("d-none");
      });

      // ✅ CLOSE WHEN CLICKING OUTSIDE
      $(document).on("click", function () {
        $("#filterDropdown").addClass("d-none");
      });

      // ✅ PREVENT INSIDE CLICKS FROM CLOSING
      $("#filterDropdown").on("click", function (e) {
        e.stopPropagation();
      });

    }

  });

})();
