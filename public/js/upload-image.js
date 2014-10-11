"use strict";

///////////////
// Uploading //
///////////////

var caseImage = {},
    imageObj = {},
    uploadKeyRoot = uploadKeyRoot,
    updateUploadKey = function(id){
      $('#uploadKey').val(uploadKeyRoot + id + "/${filename}")
    }
    
caseImage.imageStacks = [{}]

var isValidCaseImage = function(caseImage){
  var errors = []
  if (caseImage.diagnosis === ''){errors.push('Diagnosis')}
  if (caseImage.category === ''){errors.push('Category')}
  if (caseImage.imageStacks[0].modality === ''){errors.push('Modality')}

  return errors
}

/*
Save casefil.es object
*/
function saveCasefilesObject(cb){
  
  caseImage.category = $('#imageCategory').val()
  caseImage.diagnosis = $('#diagnosis').val() === '' && $('#normal').is(':checked') ? 'normal' : $('#diagnosis').val()
  caseImage.imageStacks[0].label = $('#imageLabel').val()
  caseImage.imageStacks[0].modality = $('#imageModality').val()

  var caseImageValidationErrors = isValidCaseImage(caseImage)

  if (caseImageValidationErrors.length > 0){
    var errors = caseImageValidationErrors.reduce(function(sum, error){ return sum + error + '\n' }, '')
    window.alert('The following fields are required: \n\n' + errors)
    if (cb){ return cb('Validation errors: ' + errors) }
  } else {

    var sendObj = {
      studyObj: caseImage
    }

    $.post('/api/saveImages', sendObj)
      .done(function(res){

        if (res._id){
          // image successfully saved
          console.log('Casefiles case saved:', res)
        }

        // update caseImage object
        caseImage = res

        if (cb){ cb(null) }
      })
      .fail(function(err){
        console.log('error saving images: ', err)
        window.alert('Error saving images.')
        if (cb){ cb(err) }
      })
  }
}

function saveImageObject(cb) {
  
  if (!cb){ cb = function (){ return false }}
  
  // load data from DOM
  imageObj.title = $('#imageLabel').val()
	imageObj.difficulty = $('#difficulty').val()
	imageObj.diagnosis = $('#diagnosis').val()
	imageObj.pathProven = $('#pathProven').val()
	imageObj.normal = $('#normal').val()
	imageObj.foreignId = $('#foreignId').val()
	
	if (caseImage._id){
	  imageObj.studyId = caseImage._id
	}
	
	$.post('/api/saveImage', imageObj)
    .done(function(res){

      console.log('Image object saved', res)
      cb(null)
    })
    .fail(function(err){
      window.alert('Error saving image object')
      console.log(err)
      cb(err)
    })
}

$(document).ready(function(){

  $('#saveImage').on('click', function(){ saveImageObject() })

  $('#uploadImages').on('click', function(){ uploadImages() })
      
  var uploadImages = function(){
    if (!isValidCaseImage(caseImage)){
        window.alert('Some required fields are missing!')
        return false
    }
    
    //if (!caseImage._id){

    // save any changes to the quiz object, this should also get an image
    // container if we don't have one already
    saveCasefilesObject(function(err){
      if (err){
        return false
      } else {

        updateUploadKey(caseImage.imageStacks[0]._id)

        // if there are images already, delete them
        if (caseImage.imageStacks[0].imagePaths.length > 0){
          $.post('/api/clearImages', {studyId: caseImage._id})
            .done(function(res){

              console.log('Images deleted from server', res)

              // images deleted from server
              caseImage.imageStacks[0].imagePaths = []

              // go ahead and trigger upload
              dropzone.processQueue()
            })
            .fail(function(err){
              console.log(err)
            })
        } else {
          // empty container exists, start upload
          dropzone.processQueue()
        }
      }
    })
  }

  $('#clearQueue').on('click', function(){
    dropzone.removeAllFiles()
  })

  var newImagePaths = []

  Dropzone.autoDiscover = false
  var dropzone = new Dropzone('.dropzone', {
      url: uploadURL,
      maxFilesize: 100,
      maxFiles: 1,
      paramName: 'file',
      maxThumbnailFilesize: 5,
      autoProcessQueue: false,
      thumbnailWidth: 200,
      thumbnailHeight: 200,
      dictDefaultMessage: '<div class="msg-primary">Drop files here to upload</div><div class="msg-secondary">(or click)</div>'
    })
    .on('addedfile', function(file){
      $(file.previewElement).find('.dz-success-mark,.dz-error-mark').hide()

      // just overwrite previous file if adding more than one
      if (this.files[1]!=null){
        this.removeFile(this.files[0]);
      }
      
      // uploadImages()
    })
    .on("maxfilesexceeded", function(file) { 
      this.removeFile(file)
    })
    .on('totaluploadprogress', function(total, totalBytes, totalBytesSent){
      console.log(total)
    })
    .on('error', function(file, error){
      console.log('error: ', error)
    })
    .on('success', function(file, response){
      if (response.indexOf('Location') === -1){
        return console.log('error: ', response)
      }
      var imageURL = response.split('Location')[1].slice(1, -2)
      console.log('Saved image to: ', imageURL)

      // push url into array
      newImagePaths.push(imageURL)
      
      $(file.previewElement).find('.dz-success-mark').show()

      if (this.getUploadingFiles().length > 0){
        this.processQueue()
      } else {
        onAllUploaded()
      }
    })
    
  var onAllUploaded = function(){
    console.log('complete')
    
    // set new imagePaths on quiz object
    caseImage.imageStacks[0].imagePaths = newImagePaths

    // refresh DOM to display new image
    $('#imagePreview').attr('src', newImagePaths[0])

    // clear array for next time
    newImagePaths = []
    dropzone.removeAllFiles()

    // probably should auto-save quiz to server here
    saveImageObject()
  }
})