import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

// Form schema with validation
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });
  
  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    
    try {
      await apiRequest("POST", "/api/login", data);
      toast({
        title: "Success",
        description: "You have successfully logged in",
      });
      // Redirect to dashboard after successful login
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid email or password",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }
  
  return (
    <div className="w-full max-w-md bg-dark-deeper bg-opacity-70 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border border-dark-lighter p-1">
      <div className="p-6 md:p-8">
        <h3 className="text-2xl font-bold mb-6 text-center font-special">Sign In to Q-Speech</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium block mb-2 text-light-darker">
                    Email Address
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        className="form-input w-full px-4 py-3 bg-dark-lighter border border-dark-lighter rounded-lg focus:outline-none text-light"
                        placeholder="your@email.com"
                        {...field} 
                      />
                    </FormControl>
                    <div className="input-effect"></div>
                  </div>
                  <FormMessage className="text-error text-sm mt-1" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium block mb-2 text-light-darker">
                    Password
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type="password" 
                        className="form-input w-full px-4 py-3 bg-dark-lighter border border-dark-lighter rounded-lg focus:outline-none text-light"
                        placeholder="••••••••"
                        {...field} 
                      />
                    </FormControl>
                    <div className="input-effect"></div>
                  </div>
                  <FormMessage className="text-error text-sm mt-1" />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <div className="flex items-center">
                    <Checkbox 
                      id="rememberMe" 
                      className="w-4 h-4 bg-dark-lighter rounded border-dark-lighter focus:ring-primary"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <label 
                      htmlFor="rememberMe" 
                      className="ml-2 text-sm text-light-darker"
                    >
                      Remember me
                    </label>
                  </div>
                )}
              />
              <a href="#" className="text-sm text-primary hover:text-primary-light transition">
                Forgot password?
              </a>
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="button-effect relative w-full flex justify-center py-3 px-4 rounded-lg bg-primary hover:bg-primary-dark transition text-light font-medium overflow-hidden"
                disabled={isLoading}
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="loading-state relative z-10 flex items-center"
                    >
                      <span className="loading-circle"></span>
                      <span className="loading-circle"></span>
                      <span className="loading-circle"></span>
                    </motion.div>
                  ) : (
                    <motion.span
                      key="signin"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative z-10"
                    >
                      Sign in
                    </motion.span>
                  )}
                </AnimatePresence>
                <div className="button-wave"></div>
              </Button>
            </div>
          </form>
        </Form>
        
        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-dark-lighter"></div>
          <span className="px-4 text-sm text-light-darker">Or continue with</span>
          <div className="flex-grow h-px bg-dark-lighter"></div>
        </div>
        
        {/* Social Login Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <SocialButton icon={<GitHubIcon />} />
          <SocialButton icon={<TwitterIcon />} />
          <SocialButton icon={<FacebookIcon />} />
        </div>
        
        {/* Sign Up Link */}
        <p className="mt-6 text-center text-sm text-light-darker">
          Don't have an account? 
          <a href="/register" className="text-primary hover:text-primary-light font-medium transition ml-1">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

function SocialButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="flex justify-center items-center py-2 px-4 bg-dark-lighter hover:bg-dark-lighter/80 rounded-lg transition">
      {icon}
    </button>
  );
}

function GitHubIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-light-darker" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.647.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0110 2.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.934.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.163 20 14.42 20 10c0-5.522-4.477-10-10-10z" clipRule="evenodd" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-light-darker" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-light-darker" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.879V12.89h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.989C16.343 19.129 20 14.99 20 10c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
    </svg>
  );
}
