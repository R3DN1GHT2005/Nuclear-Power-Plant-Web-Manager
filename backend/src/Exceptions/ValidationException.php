<?php

/*
 * backend/src/Exceptions/ValidationException.php
 * ValidationException — custom exception class for application-specific
 * error handling. Caught by controllers to return appropriate
 * HTTP error responses.
 */

namespace App\Exceptions;

use Exception;

class ValidationException extends Exception {
}
