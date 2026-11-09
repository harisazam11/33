
"use client";

import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Camera, AlertTriangle, CheckCircle, Wand2, Video, RotateCcw } from 'lucide-react';
import NextImage from 'next/image';
import { suggestLicensePlateAlternatives, type SuggestLicensePlateAlternativesInput } from '@/ai/flows/suggest-license-plate-alternatives';
import { useToast } from '@/hooks/use-toast';

// @refresh reset
type AiPlateEntryProps = {
  onPlateDataConfirmed: (plateData: { plateNumber: string; geoLocation: string; timestamp: string }) => void;
};

export default function AiPlateEntry({ onPlateDataConfirmed }: AiPlateEntryProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null); // null: checking, true: granted, false: denied
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const [capturedImageDataUri, setCapturedImageDataUri] = useState<string | null>(null);
  const [aiPrimaryPlate, setAiPrimaryPlate] = useState<string | null>(null);
  const [aiAlternatives, setAiAlternatives] = useState<string[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [cameraReinitTrigger, setCameraReinitTrigger] = useState(0); // New state to trigger camera re-initialization
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const videoElement = videoRef.current; 
    let localStream: MediaStream | null = null; 

    const getCameraPermission = async () => {
      if (!videoElement) {
        console.error("AiPlateEntry: videoRef.current is unexpectedly null in getCameraPermission.");
        setHasCameraPermission(false);
        setPermissionError("Video component initialization failed unexpectedly.");
        toast({
          variant: 'destructive',
          title: 'Critical Error',
          description: 'Video component could not be initialized.',
        });
        return;
      }
      
      // Reset relevant states before attempting to get permission again
      setIsVideoReady(false);
      // setHasCameraPermission(null); // Indicate we are checking, might cause quick flash of "initializing"

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        localStream = stream; 
        setHasCameraPermission(true);
        setPermissionError(null); // Clear any previous permission errors
        
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
          setIsVideoReady(true);
          videoElement.play().catch(err => {
            console.error("Error playing video:", err);
            setPermissionError(`Video playback error: ${err.message}.`);
            toast({
              variant: 'destructive',
              title: 'Video Playback Error',
              description: `Could not start camera video: ${err.message}.`,
            });
          });
        };

      } catch (error: any) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setPermissionError(`Camera access error: ${error.message}. Please enable camera permissions in your browser settings.`);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: `Please enable camera permissions in your browser settings. ${error.message}`,
        });
      }
    };
    
    getCameraPermission();

    return () => { // Cleanup function
      setIsVideoReady(false); 
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (videoElement && videoElement.srcObject) {
        // Ensure srcObject is also cleared
        const srcObjStream = videoElement.srcObject as MediaStream;
        srcObjStream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
        videoElement.onloadedmetadata = null; 
      }
    };
  }, [cameraReinitTrigger, toast]); // Added cameraReinitTrigger to dependencies

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({ variant: "destructive", title: "Capture Error", description: "Video or canvas element not ready." });
      return;
    }
    
    setIsCapturing(true);
    setAiError(null);
    setAiPrimaryPlate(null);
    setAiAlternatives([]);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!isVideoReady || video.readyState < video.HAVE_METADATA || video.videoWidth === 0 || video.videoHeight === 0) {
      toast({ variant: "destructive", title: "Capture Error", description: "Video not ready or has no dimensions. Please wait or check camera." });
      setIsCapturing(false);
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg');

      if (dataUri === "data:,") { 
        toast({ variant: "destructive", title: "Image Capture Failed", description: "Could not create image from video. Try again." });
        setAiError("Failed to create valid image from video stream.");
        setIsCapturing(false);
        return;
      }
      
      setCapturedImageDataUri(dataUri);
      await processWithAI(dataUri);
    } else {
      setAiError("Could not get image context from video stream.");
      toast({ variant: "destructive", title: "Capture Error", description: "Failed to get image context from video." });
    }
    setIsCapturing(false);
  };

  const processWithAI = async (photoDataUri: string) => {
    setIsLoadingAi(true);
    setAiError(null);

    try {
      const input: SuggestLicensePlateAlternativesInput = { photoDataUri };
      const result = await suggestLicensePlateAlternatives(input);
      
      setAiPrimaryPlate(result.primaryPlate);
      setAiAlternatives(result.alternatives || []);

      if (!result.primaryPlate && (!result.alternatives || result.alternatives.length === 0)) {
        toast({
          variant: "default",
          title: "AI Analysis Complete",
          description: "AI could not identify a clear plate number. Please enter manually or try again.",
        });
      } else {
         toast({
          title: "AI Suggestions Ready",
          description: `Primary: ${result.primaryPlate}. Alternatives: ${result.alternatives?.join(', ') || 'None'}`,
        });
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setAiError(`Failed to get AI suggestions: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "AI Suggestion Error",
        description: `Could not fetch suggestions: ${errorMessage}. Please try again later.`,
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  const confirmPlate = (plate: string) => {
    setIsLoadingAi(true); 
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const geoLocation = `Lat: ${position.coords.latitude.toFixed(5)}, Lng: ${position.coords.longitude.toFixed(5)}`;
        const timestamp = new Date().toISOString();
        onPlateDataConfirmed({ plateNumber: plate, geoLocation, timestamp });
        resetState(false); 
        toast({ title: "Plate Confirmed", description: `${plate} selected with location and time.` });
        setIsLoadingAi(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        const geoLocation = "Location unavailable";
        const timestamp = new Date().toISOString();
        onPlateDataConfirmed({ plateNumber: plate, geoLocation, timestamp });
        resetState(false); 
        toast({ variant: "default", title: "Location Error", description: "Could not get GPS location, proceeding without it. Plate confirmed." });
        setIsLoadingAi(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const resetState = useCallback((fullReset: boolean = true) => {
    setCapturedImageDataUri(null);
    setAiPrimaryPlate(null);
    setAiAlternatives([]);
    setAiError(null);
    setIsCapturing(false); // Ensure capturing state is reset

    if (fullReset) {
      // Incrementing cameraReinitTrigger will cause the useEffect to:
      // 1. Run its cleanup (stopping the old stream).
      // 2. Re-run its main logic (getCameraPermission to acquire a new stream).
      setCameraReinitTrigger(prev => prev + 1);
    }
  }, [setCameraReinitTrigger]); // setCameraReinitTrigger is stable

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Camera className="text-primary" /> Live Plate Capture & AI
        </CardTitle>
        <CardDescription>Capture license plate image. AI will suggest numbers. Confirm to fill form.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!capturedImageDataUri ? (
          <>
            <div className="border rounded-md overflow-hidden aspect-video bg-muted relative">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              
              {hasCameraPermission === null && ( 
                <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/50 text-white p-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p>Initializing Camera & Requesting Permissions...</p>
                </div>
              )}
              {hasCameraPermission === true && !isVideoReady && ( 
                 <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/50 text-white p-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p>Waiting for video stream to become ready...</p>
                </div>
              )}
            </div>

            {hasCameraPermission === false && permissionError && (
              <Alert variant="destructive" className="mt-2">
                <Video className="h-4 w-4" />
                <AlertTitle>Camera Access Problem</AlertTitle>
                <AlertDescription>{permissionError}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleCapturePhoto} 
              disabled={!isVideoReady || isCapturing || isLoadingAi || hasCameraPermission !== true} 
              className="w-full bg-primary hover:bg-primary/90 mt-2"
            >
              {isCapturing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
              Capture License Plate
            </Button>
          </>
        ) : (
          <>
            <div className="border rounded-md p-2 flex justify-center bg-muted/30 max-h-60">
              <NextImage src={capturedImageDataUri} alt="Captured license plate" width={300} height={150} className="rounded-md object-contain" data-ai-hint="license plate vehicle" />
            </div>
            
            {isLoadingAi && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
                <span className="text-muted-foreground">AI is analyzing...</span>
              </div>
            )}

            {aiError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>AI Error</AlertTitle>
                <AlertDescription>{aiError}</AlertDescription>
              </Alert>
            )}

            {aiPrimaryPlate && (
              <div className="space-y-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <Label className="text-green-700 font-semibold">AI Primary Guess:</Label>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-lg text-green-800">{aiPrimaryPlate}</p>
                  <Button size="sm" onClick={() => confirmPlate(aiPrimaryPlate)} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-4 w-4" /> Confirm This
                  </Button>
                </div>
              </div>
            )}

            {aiAlternatives.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">AI Alternatives:</Label>
                <ul className="space-y-1">
                  {aiAlternatives.map((alt, i) => (
                    <li key={i} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                      <span className="font-mono text-sm">{alt}</span>
                      <Button size="xs" variant="outline" onClick={() => confirmPlate(alt)}>Use This</Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

             {(!isLoadingAi && !aiPrimaryPlate && aiAlternatives.length === 0 && capturedImageDataUri && !aiError) && (
                <Alert>
                    <Wand2 className="h-4 w-4" />
                    <AlertTitle>No Clear Plate Identified</AlertTitle>
                    <AlertDescription>
                        AI could not confidently identify a plate number. You can try recapturing or enter it manually in the form.
                    </AlertDescription>
                </Alert>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex-col space-y-2">
        {capturedImageDataUri && (
          <Button onClick={() => resetState(true)} variant="outline" className="w-full" disabled={isLoadingAi || isCapturing}>
            <RotateCcw className="mr-2 h-4 w-4" /> Recapture or Clear
          </Button>
        )}
         <p className="text-xs text-muted-foreground text-center">Ensure good lighting and clear view of the plate for best AI results. Location services will be used upon confirmation.</p>
      </CardFooter>
    </Card>
  );
}

    