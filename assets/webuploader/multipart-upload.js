var MultiUpload = (function() {
  var ELEM = ".mulitpart-upload-container",
    ratio = window.devicePixelRatio || 1,
    _webUploader = WebUploader,
    thumbSize = 100 * ratio;

  var _options = {
    // 选完文件后，是否自动上传。
    auto: false,
    // swf文件路径
    swf: BASE_URL + "/Uploader.swf",
    //指定运行时启动顺序。默认会想尝试 html5 是否支持，如果支持则使用 html5, 否则则使用 flash.
    runtimeOrder: "html5,flash",
    //设置文件上传域的name
    fileVal: "file",
    //是否允许在文件传输时提前把下一个文件准备好
    prepareNextFile: true,
    //压缩
    compress: false,
    chunkRetry: 3,
    threads: 1,
    chunked: true,
    chunkSize: 5 * 1024 * 1024,
    fileNumLimit: 10,
    fileSizeLimit: 1024 * 1024 * 1024 * 2, //2G
    //去重， 根据文件名字、文件大小和最后修改时间来生成hash Key.
    duplicate: true
  };

  function initCreate(btnObj, options, callback) {
    _webUploader.Uploader.register(
      {
        "before-send-file": "beforeSendFile",
        "before-send": "beforeSend",
        "after-send-file": "afterSendFile"
      },
      {
        beforeSendFile: function(file) {
          if (this.options.pick.id != btnObj) {
            return;
          }
          var owner = this.owner,
            server = this.options.server,
            task = new $.Deferred(),
            obj = $("#" + file.id),
            btn = obj.parents(ELEM).find("button");

          obj
            .find(".note")
            .show()
            .html("计算文件特征...");
          obj.find("p.upload-state").hide();

          owner
            .md5File(file.source)
            .fail(function() {
              task.reject();
            })
            .progress(function(percentage) {
              obj
                .find(".note")
                .text("读取进度" + parseInt(percentage * 100) + "%");
            })
            .then(function(md5Value) {
              obj.find(".note").text("验证完毕...");
              file.md5 = md5Value;
              $.ajax(server, {
                dataType: "json",
                type: "post",
                data: {
                  option: "hashCheck",
                  hash: md5Value,
                  name: file.name,
                  size: file.size
                },
                cache: false,
                timeout: 1000
              }).then(
                function(response, textStatus, jqXHR) {
                  if (response.exist) {
                    owner.skipFile(file);
                    obj.find(".note").remove();
                    obj
                      .find("p.upload-state")
                      .show()
                      .attr("title", "正在上传")
                      .html("100%");
                    btn.html("开始上传");
                    btn.removeClass("stop");
                    btn.addClass("disabled");
                    obj
                      .parents(ELEM)
                      .find(".webuploader-pick")
                      .removeClass("disabled");
                    task.reject();

                    if (response.state === "SUCCESS") {
                      var item = obj.find("p.upload-state");
                      item.attr("title", "上传成功");
                      item
                        .removeClass("upload-state-error")
                        .html('<i class="iconfont icon-check"></i>');
                    }

                    callback(file, response);
                  } else {
                    task.resolve();
                  }
                },
                function(jqXHR, textStatus, errorThrown) {
                  task.resolve();
                }
              );
            });

          return task.promise();
        },
        beforeSend: function(block) {
          var task = new $.Deferred(),
            server = this.options.server;
          $.ajax({
            type: "POST",
            url: server,
            data: {
              option: "chunkCheck",
              hash: block.file.md5,
              chunk_index: block.chunk,
              ext: block.file.ext,
              size: block.end - block.start
            },
            cache: false,
            async: false,
            timeout: 1000, //todo 超时的话，只能认为该文件不曾上传过
            dataType: "json"
          }).then(
            function(response, textStatus, jqXHR) {
              if (response.exist) {
                task.reject();
              } else {
                task.resolve();
              }
            },
            function(jqXHR, textStatus, errorThrown) {
              //任何形式的验证失败，都触发重新上传
              task.resolve();
            }
          );
          task.resolve();
          return task.promise();
        },
        afterSendFile: function(file) {
          if (this.options.pick.id != btnObj) {
            return;
          }
          var chunksTotal = Math.ceil(file.size / this.options.chunkSize),
            deferred = WebUploader.Deferred(),
            server = this.options.server;

          $.ajax({
            type: "POST",
            url: server,
            data: {
              option: "chunksMerge",
              hash: file.md5,
              chunks: chunksTotal,
              original_name: file.source.name,
              ext: file.ext
            },
            cache: false,
            async: false,
            dataType: "json"
          }).then(
            function(response, textStatus, jqXHR) {
              deferred.resolve();
              callback(file, response);
            },
            function(jqXHR, textStatus, errorThrown) {
              deferred.reject();
            }
          );
          return deferred.promise();
        }
      }
    );

    options.pick.id = btnObj;
    Object.assign(_options, options);
    return _webUploader.create(_options);
  }

  function uploadEvent(uploader, obj) {
    var $list = obj.parents(ELEM).find(".item-list"),
      btn = obj.parents(ELEM).find("button");

    btn.on("click", function() {
      if (btn.hasClass("disabled")) {
        return;
      }
      if ($(this).hasClass("stop")) {
        uploader.stop(true);
        $(this).removeClass("stop");
        btn.html("继续上传");
      } else {
        uploader.upload();
        btn.html("暂停");
      }
    });

    //加入队列
    uploader.onFileQueued = function(file) {
      if (obj.find(".webuploader-pick").hasClass("disabled")) {
        toastr.warning("请等待上传完成!");
        return;
      }

      if (!this.options.pick.multiple) {
        $list.html("");
      }

      var $li = $(
          '<div id="' +
            file.id +
            '" class="file-item" style="width:' +
            thumbSize +
            "px;height:" +
            thumbSize +
            'px">' +
            '<div class="note"></div>' +
            '<img alt=""><p class="upload-state" ><i class="iconfont icon-cloud-upload"></i></p>' +
            "</div>"
        ),
        $img = $li.find("img");
      $list.append($li);
      this.makeThumb(
        file,
        function(error, src) {
          if (error) {
            $img.replaceWith(
              '<div class="item-cover"><i class="iconfont icon-file-unknown"></i></div>'
            );
            return;
          }
          $img.attr("src", src);
        },
        thumbSize,
        thumbSize
      );
    };

    //一堆文件加入队列
    uploader.onFilesQueued = function(files) {
      //todo...
    };

    //当文件被移除队列后触发
    uploader.onFileDequeued = function(file) {};

    uploader.onUploadBeforeSend = function(block, data) {
      data.hash = block.file.md5;
    };

    //上传之前
    uploader.onBeforeFileQueued = function(file) {
      //移除上传禁止样式
      if (btn) {
        btn.removeClass("disabled");
      }

      if (!this.options.pick.multiple) {
        var $files = this.getFiles();

        if ($files.length > 0) {
          //提示信息
          toastr.error("请等待上一个传输完毕");
          return false;
        }
        $list.children().remove();
      }
    };

    //当开始上传流程时触发
    uploader.onStartUpload = function() {
      //上传给按钮增加样式
      obj.find(".webuploader-pick").addClass("disabled");
      if (btn && !btn.hasClass("disabled")) {
        btn.html("暂停");
        btn.addClass("stop");
      }
    };

    //暂停
    uploader.onStopUpload = function() {};

    //上传进度
    uploader.onUploadProgress = function(file, percentage) {
      var $li = $("#" + file.id),
        $percent = $li.find(".progress .progress-bar");
      // 避免重复创建
      if (!$percent.length) {
        $percent = $(
          '<div class="progress progress-striped active">' +
            '<div class="progress-bar" role="progressbar" style="width: 0%">' +
            "</div>" +
            "</div>"
        )
          .appendTo($li)
          .find(".progress-bar");
      }
      $li.find(".note").remove();
      $li
        .find("p.upload-state")
        .show()
        .attr("title", "正在上传")
        .html(parseInt(percentage * 100) + "%");
      $percent.css("width", percentage * 100 + "%");
    };

    uploader.onUploadAccept = function(block, response) {
      if (response.state !== "SUCCESS") {
        toastr.error(response.state);
        var $obj = $("#" + block.file.id);
        $obj.find(".progress").fadeOut();
        uploader.cancelFile(block.file);
        var $item = $obj.find("p.upload-state");
        var $error = $obj.find("p.upload-state-error");
        if (!$error.length) {
          $item
            .addClass("upload-state-error")
            .html('<i class="iconfont icon-close"></i>');
        }
      }
    };

    //上传成功
    uploader.onUploadSuccess = function(file, response) {
      var $obj = $("#" + file.id);
      var $item = $obj.find("p.upload-state");

      if (response.state === "SUCCESS") {
        $item.attr("title", "上传成功");
        $item
          .removeClass("upload-state-error")
          .html('<i class="iconfont icon-check"></i>');
      } else {
        $item.attr("title", response.state);
        var $error = $obj.find("p.upload-state-error");
        if (!$error.length) {
          $item
            .addClass("upload-state-error")
            .html('<i class="iconfont icon-close"></i>');
        }
      }
    };

    //上传失败
    uploader.onUploadError = function(file, reason) {
      //md5校验，跳过上传会出发失败
      if (reason == undefined) return;

      var $obj = $("#" + file.id);
      var $item = $obj.find("p.upload-state");
      var $error = $obj.find("p.upload-state-error");
      toastr.error("上传失败");
      if (!$error.length) {
        $item
          .addClass("upload-state-error")
          .html('<i class="iconfont icon-close"></i>');
      }
    };

    //不管成功或者失败，文件上传完成时触发
    uploader.onUploadComplete = function(file) {
      $("#" + file.id)
        .find(".progress")
        .fadeOut();
    };

    //所有文件上传结束
    uploader.onUploadFinished = function() {
      if (btn) {
        btn.html("开始上传");
        btn.removeClass("stop");
        btn.addClass("disabled");
      }
      obj.find(".webuploader-pick").removeClass("disabled");
      uploader.reset();
    };

    uploader.onError = function(type, handler) {
      console.log(type);
      if (type === "Q_TYPE_DENIED") {
        //提示信息
        toastr.error("上传类型不允许");
      } else if (type === "F_EXCEED_SIZE") {
        //提示信息
        toastr.error("上传文件超过限制大小");
      } else if (type === "Q_EXCEED_SIZE_LIMIT") {
        //提示信息
        toastr.error("上传文件超过限制大小");
      }
    };
  }

  return {
    upload: function(options, picker, callback) {
      var _this = $(ELEM).find(picker);
      if (_this.length > 1) {
        console.error("上传实例有多个相同的class:" + picker);
      }
      _this._name = picker;
      uploadEvent(initCreate(_this, options, callback), _this);
    }
  };
})();
