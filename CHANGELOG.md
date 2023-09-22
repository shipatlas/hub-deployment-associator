# Changelog

## 1.1.0

* Add ability to specify callback-path.
* Fix incorrect default base-url.
* Add debugging output.
* Set base-url and callback-path defaults in action file.
* Configure POST request to call-back endpoint correctly:
  * Use `Token` authorization instead of `Bearer`
  * Stringify request payload into JSON.

## 1.0.0

* Initial release with ability to make an authenticated call to the
  deployment-associator endpoint on Hub while handling the response accordingly.
