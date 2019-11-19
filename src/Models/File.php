<?php

namespace Siaoynli\LaravelWebUpload\Models;

use Illuminate\Database\Eloquent\Model;

class File extends Model
{


    protected $fillable = [
        'hash',
        'path',
    ];


}
