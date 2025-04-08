import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// Form schema with validation
const formSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username must be less than 20 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    
    try {
      // Remove confirmPassword as it's not needed for the API
      const { confirmPassword, ...registerData } = data;
      
      await apiRequest("POST", "/api/register", registerData);
      toast({
        title: "Success",
        description: "Your account has been created successfully",
      });
      
      // Reset the form
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="w-full max-w-md bg-dark-deeper bg-opacity-70 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border border-dark-lighter p-1">
      <div className="p-6 md:p-8">
        <h3 className="text-2xl font-bold mb-6 text-center font-special">Create Account</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium block mb-2 text-light-darker">
                    Username
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        className="form-input w-full px-4 py-3 bg-dark-lighter border border-dark-lighter rounded-lg focus:outline-none text-light"
                        placeholder="username"
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
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium block mb-2 text-light-darker">
                    Confirm Password
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
                      key="signup"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative z-10"
                    >
                      Create Account
                    </motion.span>
                  )}
                </AnimatePresence>
                <div className="button-wave"></div>
              </Button>
            </div>
          </form>
        </Form>
        
        {/* Sign In Link */}
        <p className="mt-6 text-center text-sm text-light-darker">
          Already have an account? 
          <a href="/" className="text-primary hover:text-primary-light font-medium transition ml-1">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}