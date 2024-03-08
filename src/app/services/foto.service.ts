import { Injectable } from '@angular/core';
//importamos los plugins que se crearon de los servicios y llamado a los archivos a utilizar
import{Camera, CameraPhoto, CameraResultType, CameraSource, Photo} from '@capacitor/camera'
import{ Filesystem, Directory} from '@capacitor/filesystem'
import{ Storage} from '@capacitor/storage'
import{Foto} from '../models/foto.interface'

@Injectable({
  providedIn: 'root'
})
export class FotoService {
  //Arreglo temportal para almacenar fotos
public fotos: Foto [] = [];
private PHOTO_STORAGE: string = "fotos"

  constructor() { }
//llamdo a funcion publica para ser llamada desde afuera asincronica al desconocer el tiempo del llamado

  public async addNewToGallery(){  
    
    //proceso para tomar la foto
    const fotoCapturada = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100      
    })
       
    /*this.fotos.unshift({
      filepath: "foto_",//nombre con que se almacena la foto capturada
      webviewPath: fotoCapturada.webPath ?? ''//en caso de presentar error usar el operador ?? ''
    })
    */

   //constante que almacena la foto capturada y la graba
   const savedImageFile = await this.savePicture(fotoCapturada)
   this.fotos.unshift(savedImageFile)

   //seteamos la informacion en formato JSON para la web
   Storage.set({
    key: this.PHOTO_STORAGE,
    value: JSON.stringify(this.fotos)
   })    
  }

  public async savePicture(cameraPhoto: CameraPhoto){

    //convertir la imagen a formato base64 que es la forma en que se almacena este tipo de archivo de esta app
    const base64Data = await this.readAsBase64(cameraPhoto)
    //escribir la foto en el directorio
    const fileName = new Date("").getTime + '.jpeg';//formato de la foto(nombre de la foto)
    const saveFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    })

    return{
      filepath: fileName,
      webviewPath: cameraPhoto.webPath ?? ''
    }
  }

  public async readAsBase64(cameraPhoto: CameraPhoto){
    //convertir de blob a base64
    const response = await fetch(cameraPhoto.webPath ??'')
    const blob = await response.blob()

    return await this.convertBlobToBase64(blob) as string
  }
  //funcion flecha que use promesas para un posible retorno de un valor
  convertBlobToBase64 =(blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader
    reader.onerror = reject
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.readAsDataURL(blob)
  })

  public async loadSaved(){
      //Recuperacion de las fotos en caché    
    const listaFotos = await Storage.get({key: this.PHOTO_STORAGE })    
    this.fotos = JSON.parse(listaFotos.value || "[]")

    //Desplegar fotos leídas en formato base64
    for(let foto of this.fotos){

      //Leer cada foto almacenada en el sistema de archivos
      const readFile = await Filesystem.readFile({
        path: foto.filepath,
        directory: Directory.Data
      })

      //solo para plataforma Web: cargar las fotos en base64
      foto.webviewPath = `data:image/jpeg;base64,${readFile.data}`
    }

  }
}