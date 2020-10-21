<?php

namespace Siaoynli\LaravelWebUpload;

use Illuminate\Support\ServiceProvider;
use Illuminate\Routing\Router;


class LaravelWebUploadServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot(Router $router)
    {
        $this->loadViewsFrom(__DIR__ . '/views', 'webuploader');
        $this->publishes([
            __DIR__ . '/../assets/webuploader' => public_path('static/webuploader'),
        ], 'assets');
        $this->publishes([
            __DIR__ . '/../assets/toastr' => public_path('static/toastr'),
        ], 'assets');

        $this->publishes([
            __DIR__ . '/../config/webuploader.php' => config_path('webuploader.php'),
        ], 'config');

        $this->publishes([
            __DIR__ . '/../migrations' => database_path('migrations'),
        ], 'laravel-multipart-migrations');

        $this->publishes([
            __DIR__ . '/../views' => base_path('resources/views/vendor/webuploader'),
        ], 'resources');

        $this->publishes([
            __DIR__ . '/../demo' => base_path('resources/views'),
        ], 'resources');

        $this->registerRoute($router);
    }

    protected function registerRoute($router)
    {
        if (!$this->app->routesAreCached()) {
            $router->group(['namespace' => __NAMESPACE__ . '\\Controllers', "middleware" => config('webuploader.route.middleware', [])], function ($router) {
                if (env("APP_DEBUG", false) == true) {
                    $router->get('/webuploader/demo', 'WebuploaderController@demo')->name('webuploader.demo');
                }
                $router->post(config('webuploader.route.uri.images', '/webuploader/images'), 'WebuploaderController@images')->name('webuploader.images');
                $router->post(config('webuploader.route.uri.attaches', '/webuploader/attaches'), 'WebuploaderController@attaches')->name('webuploader.attaches');
                $router->post(config('webuploader.route.uri.videos', '/webuploader/videos'), 'WebuploaderController@videos')->name('webuploader.videos');

                $router->post(config('webuploader.route.uri.multi', '/webuploader/multi'), 'WebuploaderController@multi')->name('webuploader.multi');

            });

        }
    }
}
