/* TlbxTour: Image to 3D (the img3d folder). Targets are ids in img3d/index.html. */
TlbxTour.define({
  app: 'img3d',
  title: 'Image to 3D tour',
  steps: [
    { id: 'picture', title: 'Picture', text: 'Drop a picture here, or open one.', target: '#vp' },
    { id: 'drive', title: 'From Files', text: 'Take a picture from Files instead.', target: '#btnDrive' },
    { id: 'invert', title: 'Depth', text: 'Invert depth to make the far parts near.', target: '#invert' },
    { id: 'subject', title: 'Subject only', text: 'Remove the background so only the subject becomes 3D. Runs on your device.', target: '#subject' },
    { id: 'scale', title: 'Depth scale', text: 'How tall the relief is. Smoothing and point size are below it.', target: '#scale' },
    { id: 'send', title: 'Open in 3D Modeller', text: 'Send the finished model to 3D Modeller to edit it.', target: '#btnSend' },
  ],
});
