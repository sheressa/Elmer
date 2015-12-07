# Change these if you need to.
synced_folder = "~/Sites/Elmer"
ip = "192.168.8.8"
host_port = 8008

unless Vagrant.has_plugin?("vagrant-bindfs")
  system "vagrant plugin install vagrant-bindfs"
  raise "The BindFS Vagrant plugin is required for OSX use and was installed.  Please run your the command again."
end

Vagrant.configure("2") do |config|

  config.vm.box = "ubuntu/trusty64"
  config.vm.box_version = "20151201.0.0"

  config.vm.network :forwarded_port, guest: 80, host: host_port
  config.vm.network :private_network, ip: ip

  config.vm.hostname = "elmer.local"

  config.vm.provider :virtualbox do |v|
    v.name = "elmer"
    v.customize ["modifyvm", :id, "--cpus", "2"]
    v.customize ["modifyvm", :id, "--memory", "2048"]
  end

  config.vm.provision :shell, :path => "provision/provision.sh", privileged: false, args: 'root'

  if (/darwin/ =~ RUBY_PLATFORM)
    # On OSX, remount using bindfs to force www-data ownership:
    config.vm.synced_folder synced_folder, "/mnt/webshare", type: "nfs"
    config.bindfs.bind_folder "/mnt/webshare", "/var/www", owner: "www-data", group: "www-data", perms: nil
  else
    config.vm.synced_folder "/var/www", "/var/www", type: "nfs"
  end

  config.vm.post_up_message = "     (\\_/)\n    (='.'=)\n    (\")_(\")"

end
