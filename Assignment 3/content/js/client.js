$(document).ready(function() {
    /*
              Great resource for jQuery plugins, that's where I found the audio player plugin
              https://www.jqueryscript.net/other/single-button-audio-player.html
              MIT License
     */
              $('#left').buttonAudioPlayer({
                  /* 57 year old Norman Cook, godfather of big beat, AKA Fatboy Slim */
                  src: '/media/On_the_Floor_Gonna_Shake_It_-_Fatboy_Slim_and_Idris_Elba.mp3',
                  type:'bar-animation',
                  loop:true
                });
    
            $("#submit").click(function() {
                $.ajax({
                    url: "/authenticate",
                    type: "POST",
                    dataType: "JSON",
                    data: { email: $("#email").val(), password: $("#password").val() },
                    success: function(data) {
                        //console.log("Data returned from server: ", data);
                        if(data['status'] == "success") {
                            // redirect
                            window.location.replace("/profile");
                        } else {
                            // show error message
                            $("#errorMsg").html(data['msg']);
                        }
    
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        $("body").text(jqXHR.statusText);
                    }
                });
    
            });
    
          });
    