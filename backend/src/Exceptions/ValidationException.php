/*
 * backend/src/Exceptions/ValidationException.php
 * ValidationException — custom exception class for application-specific
 * error handling. Caught by controllers to return appropriate
 * HTTP error responses.
 */
<?php
namespace App\Exceptions;

use Exception;

class ValidationException extends Exception {
}
